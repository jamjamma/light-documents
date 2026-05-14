"use client";

import { useEffect, useState } from "react";
import { Modal } from "./ui/Modal";
import { Play, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { resetDemo, fastForwardToFiled } from "@/lib/contract-store";
import {
  CHAPTERS,
  HERO_CONTRACT_ID,
  TOUR_STEPS,
  type ChapterId,
  firstStepIndexOf,
  chapterLength,
  stepIndexWithinChapter,
  readChaptersDone,
  readChapterProgress,
  writeTourState,
  markTourSeen,
  setTourDismissed,
  resetTourState,
} from "@/lib/tour-steps";

/**
 * Chapters that pick up the story AFTER the contract is filed need the
 * demo state pre-rolled so the signed banner, full audit trail, and
 * ledger writeback are present on Bolt MSA. Without this, the user lands
 * on a page showing "Ledger writeback will appear here after the
 * contract is filed" because the in-flight Bolt is still in `in_review`.
 */
const CHAPTERS_REQUIRING_BOLT_FILED: ReadonlyArray<ChapterId> = [
  "signed",
  "archive",
];

/**
 * Chapter chooser modal.
 *
 * Opens when the user clicks "Take the tour" in the sidebar OR on first
 * visit (auto-start). User can:
 *  - Walk everything: resets demo + tour state, runs all 33 steps
 *  - Pick a chapter: resets demo, runs only that chapter
 *  - Resume a chapter: continues from the last seen step in that chapter
 *    (no reset, so any progress on in-flight contracts is preserved)
 *
 * Listens for `tour:menu-open` and `tour:menu-close` window events so the
 * Sidebar / TourController can drive visibility without a context provider.
 */
export function TourMenu() {
  const [open, setOpen] = useState(false);
  // Re-render trigger so completion checkmarks and resume offers update
  // when storage changes (e.g. after a chapter finishes).
  const [, setTick] = useState(0);
  const bump = () => setTick((n) => n + 1);

  useEffect(() => {
    const onOpen = () => {
      bump();
      setOpen(true);
    };
    const onClose = () => setOpen(false);
    window.addEventListener("tour:menu-open", onOpen);
    window.addEventListener("tour:menu-close", onClose);
    return () => {
      window.removeEventListener("tour:menu-open", onOpen);
      window.removeEventListener("tour:menu-close", onClose);
    };
  }, []);

  // Mobile fallback. The chooser modal itself is fine on mobile but the
  // tour content (popovers anchored on desktop layouts) is desktop-first.
  // We let the modal open on mobile so users see the message but disable
  // the action buttons with an inline note.
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;

  if (!open) return null;

  const done = new Set(readChaptersDone());
  const progress = readChapterProgress();

  const startWalkEverything = () => {
    resetDemo();
    resetTourState();
    markTourSeen();
    writeTourState({ active: true, stepIndex: 0, mode: "all" });
    setOpen(false);
    // Hard reload to "/" so the dashboard mounts with fresh contracts and the
    // TourController picks up the new tour-state. Avoids stale store snapshots
    // when the user is mid-flight on another page.
    if (typeof window !== "undefined") window.location.href = "/";
  };

  const startChapter = (chapter: ChapterId) => {
    // Resets demo so chapter-specific preconditions (e.g. Bolt in_review for
    // workflow) hold. Tour-progress for OTHER chapters is preserved.
    resetDemo();
    // For chapters that take place after Bolt is signed, fast-forward the
    // contract through the full workflow so the page renders the signed
    // banner, complete audit trail, and ledger writeback.
    if (CHAPTERS_REQUIRING_BOLT_FILED.includes(chapter)) {
      try {
        fastForwardToFiled(HERO_CONTRACT_ID);
      } catch {
        // ignore; chapter will still render the in-flight state if this fails
      }
    }
    markTourSeen();
    const stepIndex = firstStepIndexOf(chapter);
    writeTourState({ active: true, stepIndex, mode: "chapter", chapter });
    setOpen(false);
    const path = TOUR_STEPS[stepIndex]?.path ?? "/";
    if (typeof window !== "undefined") window.location.href = path === "*" ? "/" : path;
  };

  const resumeChapter = (chapter: ChapterId) => {
    // Resume: do NOT reset demo data. Continue from saved step index.
    // Still pre-roll Bolt if the chapter requires it AND Bolt isn't already
    // filed (e.g. user dismissed the tour before Bolt got there).
    if (CHAPTERS_REQUIRING_BOLT_FILED.includes(chapter)) {
      try {
        fastForwardToFiled(HERO_CONTRACT_ID);
      } catch {
        // ignore; already filed or transition refused
      }
    }
    const saved = progress[chapter];
    const stepIndex =
      typeof saved === "number" ? saved : firstStepIndexOf(chapter);
    markTourSeen();
    writeTourState({ active: true, stepIndex, mode: "chapter", chapter });
    setOpen(false);
    const path = TOUR_STEPS[stepIndex]?.path ?? "/";
    if (typeof window !== "undefined") {
      if (window.location.pathname === path || path === "*") {
        // Same path: fire start event for in-page render.
        window.dispatchEvent(new CustomEvent("tour:start"));
      } else {
        window.location.href = path;
      }
    }
  };

  const onCloseMenu = () => {
    // Dismissing the menu without starting a tour should still mark seen
    // (otherwise auto-start fires the menu again on every page reload).
    markTourSeen();
    setTourDismissed(true);
    setOpen(false);
  };

  return (
    <Modal
      open={open}
      onClose={onCloseMenu}
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <Play className="h-4 w-4 text-accent-700" />
          <span>Take the tour</span>
        </div>
      }
      subtitle={
        <span className="text-[12px] text-ink-500">
          Pick a chapter, or walk everything end-to-end. Each chapter resets the demo so it starts fresh.
        </span>
      }
    >
      {isMobile ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-[13px] text-amber-900">
          The guided tour is desktop-first. Open this page on a wider screen, or browse manually via the sidebar.
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={startWalkEverything}
            className="flex w-full items-start gap-3 rounded-xl border border-ink-900 bg-ink-900 px-4 py-3 text-left text-white transition-colors hover:bg-ink-800"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-300/20 text-accent-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold">Walk everything in order</div>
              <div className="mt-0.5 text-[12px] text-white/70">
                All 6 chapters, end-to-end. About 4 minutes.
              </div>
            </div>
          </button>

          <div className="-mb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
            Or pick a chapter
          </div>

          <ul className="space-y-2">
            {CHAPTERS.map((ch, i) => {
              const total = chapterLength(ch.id);
              const isDone = done.has(ch.id);
              const savedIdx = progress[ch.id];
              const inProgress =
                !isDone &&
                typeof savedIdx === "number" &&
                savedIdx > firstStepIndexOf(ch.id);
              const stepWithin =
                typeof savedIdx === "number"
                  ? stepIndexWithinChapter(ch.id, savedIdx)
                  : 0;

              return (
                <li key={ch.id}>
                  <div className="flex items-start gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold ${
                        isDone
                          ? "bg-sage-500/15 text-sage-600"
                          : "bg-ink-100 text-ink-700"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="text-[13.5px] font-semibold text-ink-900">
                          {ch.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10.5px] text-ink-500">
                          <Clock className="h-3 w-3" />
                          ~{Math.round(ch.estSeconds / 5) * 5}s · {total} step{total === 1 ? "" : "s"}
                          {isDone && (
                            <span className="ml-1 rounded bg-sage-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-sage-600">
                              Done
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-0.5 text-[12px] leading-snug text-ink-600">
                        {ch.blurb}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <button
                          onClick={() => startChapter(ch.id)}
                          className="rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-ink-900 transition-colors hover:bg-ink-50"
                        >
                          {isDone ? "Restart" : "Start"}
                        </button>
                        {inProgress && (
                          <button
                            onClick={() => resumeChapter(ch.id)}
                            className="rounded-lg border border-accent-300 bg-accent-50 px-2.5 py-1 text-[11.5px] font-medium text-accent-700 transition-colors hover:bg-accent-100"
                          >
                            Resume (step {stepWithin + 1} of {total})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-[11px] leading-relaxed text-ink-500">
            Closing the menu won't reset progress. Re-open it any time from the sidebar.
          </div>
        </div>
      )}
    </Modal>
  );
}
