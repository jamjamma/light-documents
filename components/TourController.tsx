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
  writeAllProgress,
  clearAllProgress,
  chapterProgressLabel,
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
  // Cleanup callbacks registered by the active step (resize/scroll listeners,
  // observers). Drained on destroyDriver().
  const stepCleanupRef = useRef<Array<() => void>>([]);

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
    // Drain any per-step cleanups (resize / scroll listeners, observers)
    // before destroying the driver instance so they don't fire against a
    // destroyed popover.
    while (stepCleanupRef.current.length > 0) {
      const fn = stepCleanupRef.current.pop();
      try {
        fn?.();
      } catch {
        // ignore
      }
    }
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

      // Tear down any previous popover up front. If we don't, the old
      // popover stays mounted (anchored on a possibly-already-removed DOM
      // node) during the retry-poll for the new anchor. Visually that
      // looks like the tour briefly points at the wrong thing. With this,
      // the user sees "no popover" for one polling tick instead of a
      // stale orphan.
      destroyDriver();

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
      // new page but the anchor might mount a few frames later. When a step
      // has an effect that mounts new DOM (modal:open, modal:expand-config),
      // we also want to fire the effect, give React a render cycle to mount
      // the modal, and only then start polling.
      const startWithEffect = () => {
        // Defer the effect dispatch a tick so page-level tour:effect
        // listeners attached in useEffect (which run AFTER the layout's
        // useEffect that owns the controller) can register before we
        // dispatch. Without this, hard navigations (location.href = X)
        // and Resume from the chapter chooser race: the controller fires
        // the effect on initial mount before the page useEffect attaches,
        // and the modal/menu the effect would have opened stays closed.
        const dispatchDelay = step.effect ? 60 : 0;
        // For steps that mount substantial new DOM (modal:open), give React
        // multiple paint cycles before the first poll: the modal animates in,
        // its contents lay out, the inner overflow-y-auto positions itself.
        // 300ms is conservative for typical machines but is paid only once
        // per modal-effect step (the retry-poll itself handles slower cases).
        // approval:open-actions also mounts new DOM (the menu pop-out) so it
        // benefits from the same initial wait.
        const initialDelay =
          step.effect?.startsWith("modal:") ||
          step.effect?.startsWith("template:") ||
          step.effect === "approval:open-actions" ||
          step.effect === "approval:open-reassign"
            ? 300
            : 0;
        window.setTimeout(() => {
          fireEffectOnce();
          window.setTimeout(() => tryRender(25), initialDelay);
        }, dispatchDelay);
      };

      const tryRender = (attempts: number) => {
        const el = step.selector
          ? (document.querySelector(step.selector) as HTMLElement | null)
          : null;
        if (step.selector && !el && attempts > 0) {
          window.setTimeout(() => tryRender(attempts - 1), 100);
          return;
        }

        // If we found an anchor, make sure it's actually visible in any
        // overflow:auto ancestor (e.g. TemplateDetailModal's max-h-[70vh]
        // body, DocuSignPreviewModal's inner scroll). driver.js's
        // smoothScroll only walks the window; nested scrolling containers
        // are left alone, so an anchor deep inside the modal body renders
        // the popover at an offscreen position. scrollIntoView walks every
        // scroll ancestor and adjusts only those that need it.
        if (el) {
          try {
            el.scrollIntoView({ block: "center", inline: "nearest" });
          } catch {
            // ignore (older browsers without IntersectionScrollOptions)
          }
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
        const buttons: ("close" | "next" | "previous")[] = ["close"];
        if (!step.hideBack) buttons.push("previous");
        if (!step.hideNext) buttons.push("next");

        const driveStep: DriveStep = {
          element: el ?? undefined,
          // Block clicks on the highlighted element for read-only walkthrough
          // steps (e.g. the approval chain intro, where the stage wraps the
          // whole chain card including Simulate buttons that would advance
          // the workflow). driver.js's overlay already blocks clicks
          // outside the stage; this fills the remaining gap inside it.
          disableActiveInteraction: !!step.lockInteraction,
          popover: {
            title: step.title,
            description: step.description,
            ...(el ? { side: step.side ?? "bottom" } : {}),
            ...(el && step.align ? { align: step.align } : {}),
            showButtons: buttons,
            disableButtons: [],
            nextBtnText: step.nextLabel ?? (idx === TOUR_STEPS.length - 1 ? "Finish" : "Next"),
            prevBtnText: "Back",
          },
        };

        const d = driver({
          showProgress: true,
          // Section-by-section count keeps the "60 total" out of sight. The
          // operator sees "Workflow · 5 of 12", which reads as progress
          // within the current part rather than a long way to go.
          progressText: chapterProgressLabel(idx),
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

        // Recompute popover + highlight position on relevant DOM events.
        // driver.js anchors to getBoundingClientRect at render time and does
        // not auto-track layout changes. When an anchor lives inside a
        // scrollable modal or expands/collapses (<details>), the popover
        // drifts away from its anchor without a manual refresh.
        if (el) {
          const refresh = () => {
            // driver.js's public `refresh()` re-runs the positioning code
            // for the active step using the same DriveStep config. Safe to
            // call frequently.
            try {
              d.refresh();
            } catch {
              // ignore
            }
          };
          // ResizeObserver: catches <details> expand/collapse + any other
          // size change of the anchor.
          let ro: ResizeObserver | null = null;
          if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(refresh);
            ro.observe(el);
            stepCleanupRef.current.push(() => ro?.disconnect());
          }
          // MutationObserver: catches attribute changes that don't
          // necessarily change the bounding rect (e.g. <details open>
          // toggled before content layout reflows, aria-expanded on a
          // menu button). ResizeObserver covers the eventual size change;
          // this fires earlier so the popover settles before the user
          // notices a stale anchor.
          if (typeof MutationObserver !== "undefined") {
            const mo = new MutationObserver(refresh);
            mo.observe(el, {
              attributes: true,
              attributeFilter: ["open", "class", "aria-expanded"],
            });
            stepCleanupRef.current.push(() => mo.disconnect());
          }
          // Native <details> toggle event: fires the instant the open
          // attribute flips, which is earlier than ResizeObserver in some
          // browsers. Cheap and idempotent with the other observers.
          if (el.tagName === "DETAILS") {
            el.addEventListener("toggle", refresh);
            stepCleanupRef.current.push(() =>
              el.removeEventListener("toggle", refresh),
            );
          }
          // Window resize.
          window.addEventListener("resize", refresh);
          stepCleanupRef.current.push(() =>
            window.removeEventListener("resize", refresh),
          );
          // Walk every scrollable ancestor of the anchor. driver.js's
          // smoothScroll only handles the window; nested scrolling
          // containers (the modal's max-h overflow-y-auto box) need their
          // own listeners so the popover follows when the user scrolls.
          const scrollAncestors: Element[] = [];
          let p: Element | null = el.parentElement;
          while (p) {
            const cs = window.getComputedStyle(p);
            const overflowY = cs.overflowY;
            if (
              overflowY === "auto" ||
              overflowY === "scroll" ||
              overflowY === "overlay"
            ) {
              scrollAncestors.push(p);
            }
            p = p.parentElement;
          }
          for (const ancestor of scrollAncestors) {
            ancestor.addEventListener("scroll", refresh, { passive: true });
            stepCleanupRef.current.push(() =>
              ancestor.removeEventListener("scroll", refresh),
            );
          }
        }
      };

      startWithEffect();
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
    // signed page, or "Run checks" which navigates to the freshly-created
    // contract's detail page) advance the tour past the action step
    // automatically. A future step with `path: "*"` is treated as matching
    // any pathname.
    if (step.path !== "*" && step.path !== pathname) {
      const futureMatch = TOUR_STEPS.findIndex(
        (s, i) => i > stepIndex && (s.path === "*" || s.path === pathname),
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
          // Walk-everything: mark all chapters done + clear the saved
          // walk-everything progress so the menu offers a fresh Restart
          // (not Resume from the last step) on next open.
          (["dashboard", "workflow", "signed", "archive", "templates", "intake"] as const).forEach(markChapterDone);
          clearAllProgress();
        }
        destroyDriver();
        // Land the operator back on the dashboard so they see the AboutWidget
        // and the rest of the chrome they explored. Skip if already there.
        if (pathname !== "/") {
          router.push("/");
        }
        return;
      }

      // Chapter boundary in walk-everything mode: mark the just-finished
      // chapter as done so the chapter chooser checkmarks it even though
      // the user is mid-tour. Idempotent: markChapterDone uses a Set.
      if (
        state.mode === "all" &&
        nextStep.chapter !== step.chapter
      ) {
        markChapterDone(step.chapter);
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
      } else if (state.mode === "all") {
        // Persist walk-everything progress so a mid-walk dismissal can be
        // resumed from the same step on the next "Walk everything" open.
        writeAllProgress(nextIdx);
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
      } else if (state.mode === "all") {
        writeAllProgress(prevIdx);
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
      } else if (state.mode === "all") {
        // Walk-everything dismissal: persist position so the chooser can
        // offer Resume on the next open.
        writeAllProgress(state.stepIndex);
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

  // Listen for "tour:auto-next" events. Pages dispatch this when an in-app
  // action (e.g. user clicks Preview envelope, opening the modal) should
  // advance the tour without a popover-level Next click. The event detail
  // optionally carries a `fromStepId` so the controller only advances when
  // the current step matches — guards against accidental double-advance if
  // the action also fires after the user has already clicked Next.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ fromStepId?: string }>).detail;
      const state = readTourState();
      if (!state.active) return;
      const step = TOUR_STEPS[state.stepIndex];
      if (!step) return;
      if (detail?.fromStepId && detail.fromStepId !== step.id) return;
      handlersRef.current?.next(state.stepIndex, step);
    };
    window.addEventListener("tour:auto-next", handler);
    return () => window.removeEventListener("tour:auto-next", handler);
  }, []);

  // Listen for "tour:reanchor" events. Pages dispatch this when the
  // anchor element for the current step changes (e.g. the modal's active
  // page button). driver.js's `refresh()` only re-positions the popover
  // for the SAME element; here we destroy and re-render so the popover
  // anchors on the new element matching the same selector. fromStepId
  // guard avoids spurious re-renders from stale dispatches.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ fromStepId?: string }>).detail;
      const state = readTourState();
      if (!state.active) return;
      const step = TOUR_STEPS[state.stepIndex];
      if (!step) return;
      if (detail?.fromStepId && detail.fromStepId !== step.id) return;
      // Force a re-render: clear the de-dupe guard then re-render the step.
      renderedStepIdRef.current = null;
      renderStep(state.stepIndex, step);
    };
    window.addEventListener("tour:reanchor", handler);
    return () => window.removeEventListener("tour:reanchor", handler);
  }, [renderStep]);

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
