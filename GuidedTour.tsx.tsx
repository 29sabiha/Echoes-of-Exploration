import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, SkipForward } from "lucide-react";

const STEPS = [
  { id: "explore",  text: "This is Explore. Start here to discover the machines humanity left behind." },
  { id: "atlas",    text: "Hardware Atlas lets you inspect every spacecraft in detail." },
  { id: "missions", text: "Missions takes you through historic journeys, like the Moon Mission." },
  { id: "live",     text: "Live NASA shows real-time data straight from space agencies." },
  { id: "journey",  text: "Astronaut Journey follows the path from training to launch." },
  { id: "badges",   text: "And Badges rewards you for everything you explore. Enjoy the mission!" },
];

const WELCOME =
  "Welcome, Explorer! I am Echo, your flight companion. Ready for a guided tour across each option of our interactive space museum?";

type Phase = "welcome" | "touring" | "done";

export default function GuidedTour({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [step, setStep] = useState(0);
  const [pos, setPos] = useState({ x: window.innerWidth / 2 - 45, y: 160 });
  const cancelled = useRef(false);

  const speak = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if (!("speechSynthesis" in window)) return setTimeout(resolve, 3500);
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1;
      u.pitch = 1.15;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
  }, []);

  const exit = useCallback(() => {
    cancelled.current = true;
    window.speechSynthesis?.cancel();
    onClose();
  }, [onClose]);

  // welcome narration
  useEffect(() => {
    if (phase === "welcome") speak(WELCOME);
    return () => window.speechSynthesis?.cancel();
  }, [phase, speak]);

  // tour runner
  useEffect(() => {
    if (phase !== "touring") return;
    const s = STEPS[step];
    const el = document.querySelector<HTMLElement>(`[data-tour="${s.id}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      setPos({ x: r.left + r.width / 2 - 45, y: r.bottom + 12 });
    }
    let alive = true;
    // wait for flight (~1.4s), then narrate, then next
    const t = setTimeout(async () => {
      await speak(s.text);
      if (!alive || cancelled.current) return;
      if (step < STEPS.length - 1) setStep((n) => n + 1);
      else setPhase("done");
    }, 1400);
    return () => {
      alive = false;
      clearTimeout(t);
      window.speechSynthesis?.cancel();
    };
  }, [phase, step, speak]);

  useEffect(() => {
    if (phase === "done") {
      const t = setTimeout(exit, 1200);
      return () => clearTimeout(t);
    }
  }, [phase, exit]);

  // highlight current nav item
  useEffect(() => {
    if (phase !== "touring") return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${STEPS[step].id}"]`);
    el?.classList.add("tour-highlight");
    return () => el?.classList.remove("tour-highlight");
  }, [phase, step]);

  return (
    <div className="fixed inset-0 z-[100]">
      {/* backdrop */}
      <div
        className={`absolute inset-0 transition-all duration-500 ${
          phase === "welcome" ? "bg-black/60 backdrop-blur-md" : "bg-black/30"
        }`}
      />

      {/* flying Echo */}
      <motion.div
        className="absolute left-0 top-0 pointer-events-none"
        animate={{ x: pos.x, y: pos.y }}
        transition={{ type: "spring", stiffness: 45, damping: 14, mass: 1.2 }}
      >
        <motion.img
          src="/echo-bot.png"
          alt="Echo"
          className="w-[90px] select-none drop-shadow-[0_0_18px_rgba(0,220,255,0.7)]"
          animate={{ y: [0, -10, 0], rotate: [-4, 4, -4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          draggable={false}
        />
      </motion.div>

      <AnimatePresence mode="wait">
        {/* welcome card */}
        {phase === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 w-[420px] rounded-3xl border border-cyan-500/40 bg-[#050b1a]/95 p-6 text-center shadow-[0_0_40px_rgba(0,200,255,0.25)]"
          >
            <p className="text-[11px] tracking-[0.2em] text-cyan-400">TOUR MODE • GUIDED FLIGHT</p>
            <h2 className="mt-2 text-2xl font-bold tracking-widest text-white">ECHOES OF EXPLORATION</h2>
            <p className="mt-1 text-[10px] tracking-[0.25em] text-cyan-400">THE MACHINES WE LEFT BEHIND</p>
            <p className="mt-3 text-sm text-slate-300">{WELCOME}</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => { window.speechSynthesis.cancel(); setStep(0); setPhase("touring"); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-semibold text-white"
              >
                Let's start <ArrowRight size={16} />
              </button>
              <button
                onClick={exit}
                className="flex items-center gap-2 rounded-xl border border-red-500/40 px-4 text-sm text-red-300"
              >
                <X size={14} /> Exit
              </button>
            </div>
          </motion.div>
        )}

        {/* tour controls */}
        {phase === "touring" && (
          <motion.div
            key="controls"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-cyan-500/40 bg-[#050b1a]/95 px-5 py-3"
          >
            <p className="max-w-sm text-sm text-slate-200">{STEPS[step].text}</p>
            <span className="text-xs text-cyan-400">{step + 1}/{STEPS.length}</span>
            <button
              onClick={() => {
                window.speechSynthesis.cancel();
                step < STEPS.length - 1 ? setStep(step + 1) : setPhase("done");
              }}
              className="flex items-center gap-1 rounded-lg bg-cyan-500/20 px-3 py-1.5 text-xs text-cyan-300"
            >
              <SkipForward size={14} /> Skip
            </button>
            <button
              onClick={exit}
              className="flex items-center gap-1 rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300"
            >
              <X size={14} /> Exit
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}