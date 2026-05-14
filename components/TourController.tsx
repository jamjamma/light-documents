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

      // Retry-poll for the anchor element. After a router.push we land on the
      // new page but the anchor might mount a few frames later.
      const tryRender = (attempts: number) => {
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

        // Fire the optional side-effect for this step. Page-level listeners
        // (e.g. the dashboard filtering its table) act on this. Fired AFTER
        // d.drive() so the popover is already mounted when downstream UI
        // updates.
        if (step.effect) {
          window.dispatchEvent(
            new CustomEvent("tour:effect", { detail: { effect: step.effect } }),
          );
        }
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
      // Walked past the last step (e.g. localStorage out of sync after a
      // STATE_VERSION bump). End cleanly.
      writeTourState({ active: false, stepIndex: 0 });
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
        stepIndex = futureMatch;
        step = TOUR_STEPS[stepIndex];
        writeTourState({ active: true, stepIndex });
      } else {
        destroyDriver();
        return;
      }
    }
    renderStep(stepIndex, step);
  }, [pathname, destroyDriver, renderStep]);

  // Rewrite handlersRef every render so the latest pathname / router are
  // captured. driver.js callbacks dereference handlersRef.current at click
  // time, so they always see the freshest closures.
  handlersRef.current = {
    next: (idx, step) => {
      const nextIdx = idx + 1;
      // Finishing the tour: persist completion + dismissed.
      if (nextIdx >= TOUR_STEPS.length) {
        writeTourState({ active: false, stepIndex: 0 });
        setTourDismissed(true);
        markTourSeen();
        destroyDriver();
        return;
      }
      writeTourState({ active: true, stepIndex: nextIdx });

      // The CURRENT step decides how navigation happens. If it says
      // "navigate", we push the new route and let the path-change effect
      // render the next step once the new page hydrates.
      if (step.next === "navigate" && step.goto) {
        destroyDriver();
        // If we're already on the goto path, skip the router push (no-op
        // routes can sometimes not trigger a re-render in dev).
        if (pathname === step.goto) {
          const nextStep = TOUR_STEPS[nextIdx];
          if (nextStep.path === "*" || nextStep.path === pathname) {
            renderStep(nextIdx, nextStep);
          }
        } else {
          router.push(step.goto);
        }
        return;
      }

      // Same-page advance. Defer one tick so driver.js can finish its
      // current click-handler event loop before we tear down + remount.
      const nextStep = TOUR_STEPS[nextIdx];
      if (nextStep.path === "*" || nextStep.path === pathname) {
        window.setTimeout(() => renderStep(nextIdx, nextStep), 0);
      } else {
        // Next step is on a different path and no auto-navigate directive.
        // Sit dormant; user will navigate manually.
        destroyDriver();
      }
    },
    prev: (idx) => {
      const prevIdx = Math.max(0, idx - 1);
      writeTourState({ active: true, stepIndex: prevIdx });
      const prevStep = TOUR_STEPS[prevIdx];
      if (prevStep.path === "*" || prevStep.path === pathname) {
        // Defer to next tick so driver.js can finish its click-handler event
        // loop before we tear down its instance and remount a new one. Without
        // this defer, destroying the driver from inside its own button handler
        // can leave the popover in a half-dismissed state and Back appears
        // broken.
        window.setTimeout(() => renderStep(prevIdx, prevStep), 0);
      } else {
        // Back across page boundaries: push to the prev step's path.
        destroyDriver();
        router.push(prevStep.path);
      }
    },
    close: () => {
      writeTourState({ active: false, stepIndex: 0 });
      setTourDismissed(true);
      markTourSeen();
      destroyDriver();
    },
  };

  // Listen for explicit "tour:start" events from the sidebar / callout.
  useEffect(() => {
    const handler = () => {
      writeTourState({ active: true, stepIndex: 0 });
      markTourSeen();
      const first = TOUR_STEPS[0];
      // Tour always starts on step 0's path (typically "/"). If we're
      // already there, render immediately; otherwise push the route and
      // let the path-change effect render it.
      if (first.path !== "*" && first.path !== pathname) {
        router.push(first.path);
        return;
      }
      renderStep(0, first);
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
