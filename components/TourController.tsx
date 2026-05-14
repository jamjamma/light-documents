"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { driver, type Driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import {
  TOUR_STEPS,
  type TourStep,
  readTourState,
  writeTourState,
  setTourDismissed,
  markTourSeen,
  markChapterDone,
  writeChapterProgress,
  clearChapterProgress,
} from "@/lib/tour-steps";

/**
 * Tour orchestration.
 *
 * State machine:
 *   - localStorage["tour-state"]   = { active, stepIndex }
 *   - localStorage["tour-seen"]    = "true"  // once-only auto-start gate
 *   - localStorage["tour-dismissed"] = "true" // explicit dismissal
 *
 * Lifecycle:
 *   1. Mount in root layout. Watch pathname (via Next router) and a custom
 *      window event "tour:start" fired by the sidebar / callout triggers.
 *   2. On pathname change, look at the persisted step. If its `path` matches
 *      the current pathname, render driver.js for that step. If not, sit
 *      dormant. The user (or our own router.push) will eventually land on
 *      the right page.
 *   3. Page transitions use Next router push. We retry-poll for the next
 *      anchor up to ~2.5s in 100ms increments so the popover doesn't render
 *      before the new page's DOM is ready.
 *
 * Closure correctness:
 *   driver.js callbacks (onNextClick, onPrevClick, onCloseClick) are stored
 *   in a refs object that is rewritten on every render. This is the only
 *   safe way to give driver.js handlers that see the latest pathname /
 *   state / router without recreating the driver instance.
 *
 * Mobile:
 *   The tour is hidden on viewports < 768px. The trigger buttons in the
 *   sidebar / callout short-circuit with an alert; the controller itself
 *   also short-circuits in case the viewport shrinks mid-tour.
 */
export function TourController() {
  const pathname = usePathname();
  const router = useRouter();

  // The currently mounted driver.js instance, if any.
  const driverInstanceRef = useRef<Driver | null>(null);
  // De-dupe guard so we don't re-render the same step from the same path.
  const renderedStepIdRef = useRef<string | null>(null);

  // Handlers ref: rewritten on every render so the callbacks closed-over by
  // driver.js always invoke the freshest pathname / router / state. The
  // shape is stable; only the function identities change.
  type Handlers = {
    next: (idx: number, step: TourStep) => void;
    prev: (idx: number) => void;
    close: () => void;
  };
  const handlersRef = useRef<Handlers | null>(null);

  const destroyDriver = useCallback(() => {
    if (driverInstanceRef.current) {
      try {
        driverInstanceRef.current.destroy();
      } catch {
        // ignore
      }
      driverInstanceRef.current = null;
    }
    renderedStepIdRef.current = null;
  }, []);

  /** Build and show the driver.js popover for a specific step. */
  const renderStep = useCallback(
    (idx: number, step: TourStep) => {
      // Mobile fallback. Tour is desktop-first.
      if (typeof window === "undefined" || window.innerWidth < 768) {
        destroyDriver();
        return;
      }
      // Already rendering this exact step on this same path: skip.
      if (renderedStepIdRef.current === step.id && driverInstanceRef.current) {
        return;
      }

      // Fire the optional side-effect ONCE, before the retry-poll begins.
      // Listeners (the contract detail page, the dashboard) may need to mount
      // new DOM in response to the effect — e.g. open the DocuSign preview
      // modal, expand a <details>, scroll into view — and the polling below
      // will wait up to ~2.5s for the resulting anchor to appear. Firing this
      // before the poll is what makes "modal:open" + selector inside modal
      // work in a single step.
      let effectFired = false;
      const fireEffectOnce = () => {
        if (effectFired) return;
        effectFired = true;
        if (step.effect) {
          window.dispatchEvent(
            new CustomEvent("tour:effect", { detail: { effect: step.effect } }),
          );
        }
      };

      // Retry-poll for the anchor element. After a router.push we land on the
      // new page but the anchor might mount a few frames later.
      const tryRender = (attempts: number) => {
        fireEffectOnce();
        const el = step.selector
          ? (document.querySelector(step.selector) as HTMLElement | null)
          : null;
        if (step.selector && !el && attempts > 0) {
          window.setTimeout(() => tryRender(attempts - 1), 100);
          return;
        }

        destroyDriver();

        // Only pass `side` when there's an actual element to anchor to.
        // For centered popovers (no element) driver.js floats them in the
        // viewport; passing side="bottom" mistakenly pins them to the
        // bottom of the page instead of centering.
        //
        // disableButtons: [] is REQUIRED. driver.js's drive() function auto-
        // sets `disableButtons: ["previous"]` whenever the driver's internal
        // steps array has no previous step. Our model creates a fresh single-
        // step driver per tour step, so driver.js always thinks there's no
        // previous to go back to and greys out the Prev button regardless of
        // our onPrevClick handler. Spreading an empty array here overrides
        // that auto-disable so Back fires normally.
        const driveStep: DriveStep = {
          element: el ?? undefined,
          popover: {
            title: step.title,
            description: step.description,
            ...(el ? { side: step.side ?? "bottom" } : {}),
            showButtons: step.hideBack
              ? ["close", "next"]
              : ["close", "previous", "next"],
            disableButtons: [],
            nextBtnText: step.nextLabel ?? (idx === TOUR_STEPS.length - 1 ? "Finish" : "Next"),
            prevBtnText: "Back",
          },
        };

        const d = driver({
          showProgress: true,
          progressText: `${idx + 1} of ${TOUR_STEPS.length}`,
          allowClose: true,
          allowKeyboardControl: true,
          smoothScroll: true,
          stagePadding: 6,
          overlayColor: "rgba(15, 23, 42, 0.55)",
          steps: [driveStep],
          onNextClick: () => handlersRef.current?.next(idx, step),
          onPrevClick: () => handlersRef.current?.prev(idx),
          onCloseClick: () => handlersRef.current?.close(),
          onPopoverRender: (popoverDom) => {
            popoverDom.wrapper.classList.add("light-tour-popover");
          },
        });

        driverInstanceRef.current = d;
        renderedStepIdRef.current = step.id;
        d.drive();
      };

      tryRender(25); // up to ~2.5s of retries at 100ms each
    },
    [destroyDriver],
  );

  /** Reconcile what should be on screen against the persisted state. */
  const renderForCurrentState = useCallback(() => {
    const state = readTourState();
    if (!state.active) {
      destroyDriver();
      return;
    }
    let stepIndex = state.stepIndex;
    let step = TOUR_STEPS[stepIndex];
    if (!step) {
      writeTourState({ ...state, active: false, stepIndex: 0 });
      setTourDismissed(true);
      destroyDriver();
      return;
    }
    // If the current step's path doesn't match the pathname, look for a
    // later step whose path DOES match. This lets in-app side-effects (e.g.
    // the user clicking "Send via DocuSign" which auto-redirects to the
    // signed page) advance the tour past the action step automatically.
    if (step.path !== "*" && step.path !== pathname) {
      const futureMatch = TOUR_STEPS.findIndex(
        (s, i) => i > stepIndex && s.path === pathname,
      );
      if (futureMatch !== -1) {
        const matchedStep = TOUR_STEPS[futureMatch];
        // Chapter boundary check: when running a single chapter, do not
        // jump into a different chapter's territory just because the user
        // navigated. End the chapter cleanly and open the menu so the user
        // can pick the next chapter.
        if (
          state.mode === "chapter" &&
          state.chapter &&
          matchedStep.chapter !== state.chapter
        ) {
          markChapterDone(state.chapter);
          clearChapterProgress(state.chapter);
          writeTourState({ ...state, active: false, stepIndex: 0 });
          destroyDriver();
          window.dispatchEvent(new CustomEvent("tour:menu-open"));
          return;
        }
        stepIndex = futureMatch;
        step = TOUR_STEPS[stepIndex];
        writeTourState({ ...state, active: true, stepIndex });
      } else {
        destroyDriver();
        return;
      }
    }
    // Save chapter progress on every render so Resume works after a dismiss.
    if (state.mode === "chapter" && state.chapter) {
      writeChapterProgress(state.chapter, stepIndex);
    }
    renderStep(stepIndex, step);
  }, [pathname, destroyDriver, renderStep]);

  // Rewrite handlersRef every render so the latest pathname / router are
  // captured. driver.js callbacks dereference handlersRef.current at click
  // time, so they always see the freshest closures.
  handlersRef.current = {
    next: (idx, step) => {
      const state = readTourState();
      const nextIdx = idx + 1;
      const nextStep = TOUR_STEPS[nextIdx];

      // Finished the entire tour (mode === "all" reaches the last step).
      if (!nextStep) {
        writeTourState({ ...state, active: false, stepIndex: 0 });
        setTourDismissed(true);
        markTourSeen();
        if (state.mode === "chapter" && state.chapter) {
          markChapterDone(state.chapter);
          clearChapterProgress(state.chapter);
        } else {
          // Walk-everything: mark all chapters done.
          (["dashboard", "workflow", "signed", "archive", "templates", "intake"] as const).forEach(markChapterDone);
        }
        destroyDriver();
        return;
      }

      // Chapter boundary: in chapter mode, ending the chapter opens the menu.
      if (
        state.mode === "chapter" &&
        state.chapter &&
        nextStep.chapter !== state.chapter
      ) {
        markChapterDone(state.chapter);
        clearChapterProgress(state.chapter);
        writeTourState({ ...state, active: false, stepIndex: 0 });
        destroyDriver();
        window.dispatchEvent(new CustomEvent("tour:menu-open"));
        return;
      }

      writeTourState({ ...state, active: true, stepIndex: nextIdx });
      if (state.mode === "chapter" && state.chapter) {
        writeChapterProgress(state.chapter, nextIdx);
      }

      // The CURRENT step decides how navigation happens.
      if (step.next === "navigate" && step.goto) {
        destroyDriver();
        if (pathname === step.goto) {
          if (nextStep.path === "*" || nextStep.path === pathname) {
            renderStep(nextIdx, nextStep);
          }
        } else {
          router.push(step.goto);
        }
        return;
      }

      // Same-page advance. Defer so driver.js finishes its click handler.
      if (nextStep.path === "*" || nextStep.path === pathname) {
        window.setTimeout(() => renderStep(nextIdx, nextStep), 0);
      } else {
        destroyDriver();
      }
    },
    prev: (idx) => {
      const state = readTourState();
      const prevIdx = Math.max(0, idx - 1);
      const prevStep = TOUR_STEPS[prevIdx];
      // Back across chapter boundary: don't escape chapter; sit dormant.
      if (
        state.mode === "chapter" &&
        state.chapter &&
        prevStep.chapter !== state.chapter
      ) {
        return;
      }
      writeTourState({ ...state, active: true, stepIndex: prevIdx });
      if (state.mode === "chapter" && state.chapter) {
        writeChapterProgress(state.chapter, prevIdx);
      }
      if (prevStep.path === "*" || prevStep.path === pathname) {
        window.setTimeout(() => renderStep(prevIdx, prevStep), 0);
      } else {
        destroyDriver();
        router.push(prevStep.path);
      }
    },
    close: () => {
      const state = readTourState();
      // Persist progress so Resume offers continue. Don't mark chapter done
      // (user dismissed mid-flow). Mark seen so auto-start doesn't fire.
      if (state.mode === "chapter" && state.chapter) {
        writeChapterProgress(state.chapter, state.stepIndex);
      }
      writeTourState({ ...state, active: false, stepIndex: 0 });
      setTourDismissed(true);
      markTourSeen();
      destroyDriver();
    },
  };

  // Listen for "tour:start" events. The CALLER (TourMenu, auto-start) is
  // responsible for setting tour-state correctly BEFORE firing this event.
  // We just look at the persisted state and render the right step.
  useEffect(() => {
    const handler = () => {
      const state = readTourState();
      if (!state.active) return;
      markTourSeen();
      const step = TOUR_STEPS[state.stepIndex];
      if (!step) return;
      if (step.path !== "*" && step.path !== pathname) {
        router.push(step.path);
        return;
      }
      renderStep(state.stepIndex, step);
    };
    window.addEventListener("tour:start", handler);
    return () => window.removeEventListener("tour:start", handler);
  }, [pathname, renderStep, router]);

  // Re-render on path change.
  useEffect(() => {
    renderForCurrentState();
    return () => {
      // Cleanup on unmount only. Path-change re-runs will destroy +
      // re-render inside renderForCurrentState as needed.
      destroyDriver();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
