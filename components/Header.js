import { motion } from "framer-motion";
import { Dices } from "lucide-react";

export default function Header({ border, boxShadow }) {
  return (
    <nav className="relative z-50 flex items-center justify-between px-8 py-6">
      {/* Logo - Left Side */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-2"
      >
        <Dices className="w-8 h-8 text-emerald-400" />
        <span className="text-2xl font-bold text-white">
          Crypto<span className="text-emerald-400">Casino</span>
        </span>
      </motion.div>

      {/* Navigation Links - Centered */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2"
      >
        <a
          href="#games"
          className="text-white/80 hover:text-emerald-400 transition-colors text-sm font-medium"
        >
          Games
        </a>
        <a
          href="#rewards"
          className="text-white/80 hover:text-emerald-400 transition-colors text-sm font-medium"
        >
          Rewards
        </a>
        <a
          href="#about"
          className="text-white/80 hover:text-emerald-400 transition-colors text-sm font-medium"
        >
          About
        </a>
      </motion.div>

      {/* Connect Wallet Button - Right Side */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{
          border: border,
          boxShadow: boxShadow,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-6 py-2.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-sm transition-all hover:bg-emerald-500/20"
      >
        Connect Wallet
      </motion.button>
    </nav>
  );
}

