import { motion } from "motion/react";
import { useState } from "react";
import { Mail, Check, Copy, Send } from "lucide-react";
import { playTickSound } from "../utils/sound";

export default function ContactPostcard() {
  const [copied, setCopied] = useState(false);
  const email = "ayushrai1109@gmail.com";

  const handleCopyEmail = async () => {
    playTickSound();
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
      const textarea = document.createElement("textarea");
      textarea.value = email;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section id="contact" className="contact-section-wrap">
      <motion.div
        className="postcard-frame"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className="postcard">
          {/* Header Tag */}
          <div className="postcard-header-tag">P O S T &nbsp; C A R D</div>

          <div className="postcard-grid">
            {/* Left Column: Letter Message */}
            <div className="postcard-left">
              {/* Status Pill */}
              <div className="postcard-status-pill">
                <span className="postcard-pulse-dot" />
                <span>Available for new projects</span>
              </div>

              {/* Title */}
              <h2 className="postcard-title">
                Let's build something{" "}
                <span className="postcard-title-highlight">together</span>
              </h2>

              {/* Description */}
              <p className="postcard-body">
                I'm open to freelance work, collaborations, and full-time roles.
                Write to me about what you're making. I read everything and reply
                within a day or two.
              </p>

              {/* Action Buttons */}
              <div className="postcard-actions">
                <a
                  href={`mailto:${email}`}
                  className="btn-ink"
                  onClick={() => playTickSound()}
                >
                  <Mail size={18} />
                  <span>Say hello</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="btn-soft"
                >
                  {copied ? (
                    <>
                      <Check size={16} color="#10b981" />
                      <span style={{ color: "#10b981" }}>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>{email}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Handwritten Signature (Caveat) */}
              <p className="postcard-signature">Cheers, Ayush</p>

              {/* Handwritten Postscript */}
              <p className="postcard-ps">
                P.S. always up for chats about web dev, open source, startups & AI.
              </p>
            </div>

            {/* Right Column: Postage Stamp & Recipient Details */}
            <div className="postcard-right">
              {/* Vintage Perforated Postage Stamp */}
              <div className="stamp-container">
                <div className="stamp-wrap">
                  <div className="stamp">
                    <div className="stamp-art">
                      <Send size={42} color="#ffffff" strokeWidth={1.8} style={{ transform: "rotate(-15deg)" }} />
                      <span className="stamp-value">₹5</span>
                    </div>
                    <div className="stamp-caption">Air mail</div>
                  </div>
                </div>
              </div>

              {/* Circular Postal Postmark Seal */}
              <div className="postmark-wrap" aria-hidden="true">
                <svg viewBox="0 0 160 160" width="155" height="155">
                  {/* Concentric postal rings */}
                  <circle cx="80" cy="80" r="74" fill="none" stroke="currentColor" strokeWidth="1.8" strokeDasharray="5 3" />
                  <circle cx="80" cy="80" r="62" fill="none" stroke="currentColor" strokeWidth="1.2" />

                  {/* Circular Text Path */}
                  <defs>
                    <path
                      id="postmark-circle-path"
                      d="M 80 80 m -50, 0 a 50,50 0 1,1 100,0 a 50,50 0 1,1 -100,0"
                    />
                  </defs>
                  <text fontSize="10.5" fontWeight="700" letterSpacing="0.12em" fill="currentColor">
                    <textPath href="#postmark-circle-path" startOffset="50%" textAnchor="middle">
                      POSTED WITH CARE ★ ANSWERED FAST ★
                    </textPath>
                  </text>

                  {/* Center Text & Wavy Lines */}
                  <text x="80" y="74" textAnchor="middle" fontSize="13" fontWeight="800" letterSpacing="0.15em" fill="currentColor">
                    REPLY
                  </text>
                  <line x1="56" y1="80" x2="104" y2="80" stroke="currentColor" strokeWidth="1.5" />
                  <text x="80" y="93" textAnchor="middle" fontSize="13" fontWeight="800" letterSpacing="0.15em" fill="currentColor">
                    PAID
                  </text>

                  {/* Wavy Stamp Cancellation Lines extending right */}
                  <path
                    d="M 125 68 Q 140 64 155 68 M 125 80 Q 140 76 155 80 M 125 92 Q 140 88 155 92"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Recipient Ruled Postal Lines */}
              <div className="postcard-recipient-block">
                <div className="postcard-to-label">To</div>
                <div className="postcard-line">Ayush Rai</div>
                <div className="postcard-line">
                  <a href={`mailto:${email}`}>{email}</a>
                </div>
                <div className="postcard-line">Full stack dev, India</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
