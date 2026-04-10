
  const handleKeyDown = (e) => { if (e.key === "Enter") handleSubmit(); };

  const BLUE       = "#3b82f6";
  const BLUE_LIGHT = "#60a5fa";
  const BLUE_DEEP  = "#1d4ed8";
  const btnGrad    = `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DEEP} 100%)`;
  const btnShadow  = `0 4px 22px rgba(59,130,246,0.38)`;

  const t = isDark ? {
    bg:               "radial-gradient(ellipse 110% 90% at 50% 15%, #0b1a35 0%, #060e20 55%, #030810 100%)",
    card:             "rgba(255,255,255,0.055)",
    cardBorder:       "rgba(96,165,250,0.18)",
    shadow:           "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)",
    text:             "#f1f5f9",
    textSub:          "rgba(241,245,249,0.48)",
    input:            "rgba(255,255,255,0.06)",
    inputBorder:      "rgba(96,165,250,0.22)",
    inputFocusBorder: "#60a5fa",
    inputFocusShadow: "0 0 0 3px rgba(96,165,250,0.14)",
    label:            "rgba(241,245,249,0.58)",
    toggleBg:         "rgba(255,255,255,0.06)",
    toggleBorder:     "rgba(255,255,255,0.09)",
    modeInactive:     "rgba(241,245,249,0.42)",
    modeActiveText:   "#fff",
    glow1:            "rgba(59,130,246,0.13)",
    glow2:            "rgba(29,78,216,0.09)",
    watermark:        "rgba(255,255,255,0.025)",
    footer:           "rgba(241,245,249,0.22)",
    errorBg:          "rgba(239,68,68,0.1)",
    errorBorder:      "rgba(239,68,68,0.25)",
    errorText:        "#fca5a5",
    resetBg:          "rgba(255,255,255,0.04)",
    resetBorder:      "rgba(255,255,255,0.09)",
    strengthEmpty:    "rgba(255,255,255,0.1)",
  } : {
    bg:               "radial-gradient(ellipse 110% 90% at 50% 15%, #dbeafe 0%, #eff6ff 55%, #f8faff 100%)",
    card:             "rgba(255,255,255,0.72)",
    cardBorder:       "rgba(59,130,246,0.22)",
    shadow:           "0 24px 64px rgba(37,99,235,0.1), inset 0 1px 0 rgba(255,255,255,0.9)",
    text:             "#0f172a",
    textSub:          "rgba(15,23,42,0.5)",
    input:            "rgba(255,255,255,0.85)",
    inputBorder:      "rgba(59,130,246,0.25)",
    inputFocusBorder: "#3b82f6",
    inputFocusShadow: "0 0 0 3px rgba(59,130,246,0.12)",
    label:            "rgba(15,23,42,0.6)",
    toggleBg:         "rgba(15,23,42,0.06)",
    toggleBorder:     "rgba(15,23,42,0.1)",
    modeInactive:     "rgba(15,23,42,0.42)",
    modeActiveText:   "#fff",
    glow1:            "rgba(59,130,246,0.14)",
    glow2:            "rgba(96,165,250,0.1)",
    watermark:        "rgba(15,23,42,0.032)",
    footer:           "rgba(15,23,42,0.36)",
    errorBg:          "rgba(239,68,68,0.07)",
    errorBorder:      "rgba(239,68,68,0.2)",
    errorText:        "#dc2626",
    resetBg:          "rgba(59,130,246,0.04)",
    resetBorder:      "rgba(59,130,246,0.12)",
    strengthEmpty:    "rgba(15,23,42,0.1)",
  };

  const inputStyle = {
    width: "100%", padding: "13px 16px", borderRadius: 10,
    border: `1.5px solid ${t.inputBorder}`,
    fontSize: 14, outline: "none",
    background: t.input, color: t.text,
    fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s, background 0.3s",
  };
  const labelStyle = {
    fontSize: 12, fontWeight: 600, color: t.label,
    marginBottom: 7, display: "block", letterSpacing: 0.3, transition: "color 0.3s",
  };

  const clones = [
    { size: 115, pos: { top: "5%",    left: "3%"    }, anim: "ztDrift1 22s ease-in-out infinite", delay: "0s",   blur: 1.5, op: isDark ? 0.07 : 0.09 },
    { size:  72, pos: { top: "10%",   right: "5%"   }, anim: "ztDrift2 16s ease-in-out infinite", delay: "-4s",  blur: 0,   op: isDark ? 0.05 : 0.07 },
    { size:  58, pos: { top: "58%",   left: "1%"    }, anim: "ztFloat  12s ease-in-out infinite", delay: "-7s",  blur: 0.5, op: isDark ? 0.08 : 0.10 },
    { size: 100, pos: { bottom: "7%", right: "3%"   }, anim: "ztDrift1 28s ease-in-out infinite", delay: "-11s", blur: 2,   op: isDark ? 0.05 : 0.07 },
    { size:  46, pos: { top: "40%",   right: "9%"   }, anim: "ztPulse   9s ease-in-out infinite", delay: "-2s",  blur: 0,   op: isDark ? 0.09 : 0.11 },
    { size:  68, pos: { bottom: "20%",left: "7%"    }, anim: "ztDrift2 18s ease-in-out infinite", delay: "-6s",  blur: 0,   op: isDark ? 0.06 : 0.08 },
    { size:  84, pos: { bottom: "32%",right: "16%"  }, anim: "ztFloat  14s ease-in-out infinite", delay: "-9s",  blur: 1,   op: isDark ? 0.04 : 0.06 },
    { size:  42, pos: { top: "25%",   left: "14%"   }, anim: "ztDrift1 13s ease-in-out infinite", delay: "-3s",  blur: 0,   op: isDark ? 0.06 : 0.08 },
  ];

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: t.bg, fontFamily: "'DM Sans', sans-serif",
      padding: "20px 20px 44px", position: "relative", overflow: "hidden",
      transition: "background 0.45s ease",
    }}>

      {/* Dark / Light toggle */}
      <button onClick={() => setIsDark(d => !d)} aria-label="Toggle theme" style={{
        position: "fixed", top: 16, right: 16, zIndex: 10,
        width: 42, height: 42, borderRadius: 12,
        border: `1px solid ${t.cardBorder}`,
        background: t.card, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        color: t.text, transition: "all 0.35s",
        boxShadow: "0 4px 18px rgba(0,0,0,0.18)",
        animation: "ztFadeIn 0.6s ease both",
      }}>
        {isDark ? (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>

      {/* Floating logo clones in background */}
      {clones.map((c, i) => (
        <div key={i} aria-hidden="true" style={{
          position: "fixed", zIndex: 0, pointerEvents: "none",
          width: c.size, height: c.size,
          opacity: c.op,
          animation: c.anim,
          animationDelay: c.delay,
          filter: `blur(${c.blur}px) drop-shadow(0 0 ${Math.round(c.size * 0.28)}px rgba(59,130,246,0.45))`,
          transition: "opacity 0.45s",
          ...c.pos,
        }}>
          <img src={LOGO_SRC} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "22%" }}
            onError={e => { e.target.style.display = "none"; }} />
        </div>
      ))}

      {/* Ambient glow orbs */}
      <div aria-hidden="true" style={{
        position: "fixed", top: "-18%", left: "50%", transform: "translateX(-50%)",
        width: "70vw", height: "50vh",
        background: `radial-gradient(ellipse at center, ${t.glow1} 0%, transparent 70%)`,
        pointerEvents: "none", zIndex: 0, transition: "background 0.45s",
      }} />
      <div aria-hidden="true" style={{
        position: "fixed", bottom: "-10%", right: "-8%",
        width: "45vw", height: "45vh",
        background: `radial-gradient(ellipse at center, ${t.glow2} 0%, transparent 70%)`,
        pointerEvents: "none", zIndex: 0, transition: "background 0.45s",
      }} />

      {/* Watermark */}
      <div aria-hidden="true" style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        fontSize: "clamp(72px, 16vw, 185px)", fontWeight: 900, letterSpacing: "-0.04em",
        color: t.watermark, whiteSpace: "nowrap", userSelect: "none", pointerEvents: "none",
        zIndex: 0, transition: "color 0.45s",
      }}>ZURITRACK</div>

      {/* Main content */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 440, animation: "ztFadeUp 0.55s ease both" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ marginBottom: 14, display: "flex", justifyContent: "center" }}>
            <div style={{
              width: 58, height: 58, borderRadius: 17,
              background: btnGrad,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: btnShadow,
              animation: "ztBounce 3.2s ease-in-out infinite",
            }}>
              <img src={LOGO_SRC} alt="ZuriTrack" style={{ width: 37, height: 37, objectFit: "contain" }}
                onError={e => { e.target.style.display = "none"; }} />
            </div>
          </div>
          <h1 style={{
            fontSize: "clamp(17px, 4vw, 22px)", fontWeight: 900, color: t.text,
            letterSpacing: "0.055em", textTransform: "uppercase",
            margin: "0 0 8px", lineHeight: 1.25, transition: "color 0.35s",
          }}>
            <span style={{ color: BLUE_LIGHT }}>Let's Connect</span>
            <span style={{ display: "block", fontSize: "0.87em" }}>with ZuriTrack</span>
          </h1>
          <p style={{ fontSize: 13, color: t.textSub, margin: 0, lineHeight: 1.55, transition: "color 0.35s" }}>
            Seamlessly manage your inventory &amp; sales
          </p>
        </div>

        {/* Glass card */}
        <div style={{
          background: t.card, border: `1px solid ${t.cardBorder}`,
          borderRadius: 20, padding: "28px 26px",
          backdropFilter: "blur(26px)", WebkitBackdropFilter: "blur(26px)",
          boxShadow: t.shadow,
          transition: "background 0.4s, border-color 0.4s, box-shadow 0.4s",
        }}>

          {/* Mode tabs */}
          <div style={{
            display: "flex", background: t.toggleBg, border: `1px solid ${t.toggleBorder}`,
            borderRadius: 12, padding: 3, marginBottom: 22, transition: "background 0.35s",
          }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1, padding: "9px 0", border: "none", borderRadius: 10, cursor: "pointer",
                  fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  background: mode === m ? btnGrad : "transparent",
                  color: mode === m ? t.modeActiveText : t.modeInactive,
                  boxShadow: mode === m ? btnShadow : "none",
                  transition: "all 0.25s",
                }}>
                {m === "login" ? "Log In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Auth form */}
          {step === "auth" && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Email</label>
                <input ref={emailRef} type="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="Enter your email here"
                  style={inputStyle}
                  onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
                  onFocus={e => { e.target.style.borderColor = t.inputFocusBorder; e.target.style.boxShadow = t.inputFocusShadow; }}
                  onBlur={e =>  { e.target.style.borderColor = t.inputBorder;      e.target.style.boxShadow = "none"; }}
                />
              </div>

              {mode === "signup" && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Shop Name</label>
                  <input value={shopName} onChange={e => setShopName(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="e.g. Mama's General Store" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = t.inputFocusBorder; e.target.style.boxShadow = t.inputFocusShadow; }}
                    onBlur={e =>  { e.target.style.borderColor = t.inputBorder;      e.target.style.boxShadow = "none"; }}
                  />
                </div>
              )}

              <div style={{ marginBottom: mode === "login" ? 2 : 14 }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder={mode === "signup" ? "At least 6 characters" : "Enter your password"}
                    style={{ ...inputStyle, paddingRight: 46 }}
                    onFocus={e => { e.target.style.borderColor = t.inputFocusBorder; e.target.style.boxShadow = t.inputFocusShadow; }}
                    onBlur={e =>  { e.target.style.borderColor = t.inputBorder;      e.target.style.boxShadow = "none"; }}
                  />
                  <button onClick={() => setShowPass(!showPass)} style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: t.label, padding: 4,
                  }}>
                    {showPass ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {mode === "login" && (
                <div style={{ textAlign: "right", marginBottom: 14 }}>
                  <button type="button" onClick={() => { setStep("reset"); setError(""); }}
                    style={{ border: "none", background: "transparent", color: BLUE_LIGHT, fontWeight: 600, cursor: "pointer", fontSize: 12 }}>
                    Forgot Password?
                  </button>
                </div>
              )}

              {mode === "signup" && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Confirm Password</label>
                  <input type={showPass ? "text" : "password"} value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Re-enter your password" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = t.inputFocusBorder; e.target.style.boxShadow = t.inputFocusShadow; }}
                    onBlur={e =>  { e.target.style.borderColor = t.inputBorder;      e.target.style.boxShadow = "none"; }}
                  />
                </div>
              )}

              {mode === "signup" && password.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
                    {[1,2,3,4].map(level => (
                      <div key={level} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: password.length >= level * 3
                          ? password.length >= 12 ? "#22c55e" : password.length >= 8 ? "#f59e0b" : "#ef4444"
                          : t.strengthEmpty,
                        transition: "background 0.3s",
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: password.length >= 12 ? "#22c55e" : password.length >= 8 ? "#f59e0b" : "#ef4444" }}>
                    {password.length >= 12 ? "Strong password" : password.length >= 8 ? "Good password" : password.length >= 6 ? "Fair password" : "Too short"}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Password recovery */}
          {step === "reset" && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: t.text, transition: "color 0.35s" }}>Recover Password</div>
                <button type="button" onClick={() => { setStep("auth"); setError(""); }}
                  style={{ border: "none", background: "transparent", color: BLUE_LIGHT, fontWeight: 600, cursor: "pointer", fontSize: 12 }}>
                  Back
                </button>
              </div>
              <label style={labelStyle}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" style={{ ...inputStyle, marginBottom: 12 }}
                onFocus={e => { e.target.style.borderColor = t.inputFocusBorder; e.target.style.boxShadow = t.inputFocusShadow; }}
                onBlur={e =>  { e.target.style.borderColor = t.inputBorder;      e.target.style.boxShadow = "none"; }}
              />
              <button type="button" onClick={sendRecoveryCode} disabled={loading} style={{
                width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
                background: loading ? "rgba(59,130,246,0.38)" : btnGrad,
                color: "#fff", fontWeight: 700, cursor: loading ? "wait" : "pointer",
                fontSize: 14, marginBottom: 14, boxShadow: loading ? "none" : btnShadow,
              }}>
                Send Recovery Code
              </button>
              <div style={{ padding: 14, borderRadius: 12, background: t.resetBg, border: `1px solid ${t.resetBorder}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.label, marginBottom: 10 }}>Enter code &amp; new password</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {[
                    { val: resetCode,        set: setResetCode,        ph: "6-digit code",        type: "text" },
                    { val: resetNewPass,     set: setResetNewPass,     ph: "New password",         type: showPass ? "text" : "password" },
                    { val: resetConfirmPass, set: setResetConfirmPass, ph: "Confirm new password", type: showPass ? "text" : "password" },
                  ].map(({ val, set, ph, type }, i) => (
                    <input key={i} type={type} value={val} onChange={e => set(e.target.value)}
                      placeholder={ph} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = t.inputFocusBorder; e.target.style.boxShadow = t.inputFocusShadow; }}
                      onBlur={e =>  { e.target.style.borderColor = t.inputBorder;      e.target.style.boxShadow = "none"; }}
                    />
                  ))}
                </div>
                <button type="button" onClick={applyPasswordReset} disabled={loading} style={{
                  width: "100%", marginTop: 12, padding: "12px 0", borderRadius: 10,
                  border: "1px solid rgba(59,130,246,0.28)",
                  background: "rgba(59,130,246,0.1)", color: BLUE_LIGHT, fontWeight: 700,
                  cursor: loading ? "wait" : "pointer", fontSize: 14,
                }}>
                  Reset Password
                </button>
                <div style={{ marginTop: 8, fontSize: 11, color: t.textSub }}>
                  A 6-digit code will be sent to your email (valid 10 min).
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              padding: "11px 14px", borderRadius: 10, marginBottom: 14,
              background: t.errorBg, border: `1px solid ${t.errorBorder}`,
              color: t.errorText, fontSize: 13, fontWeight: 500,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            style={{
              display: step === "auth" ? "block" : "none",
              width: "100%", padding: "14px 0", border: "none", borderRadius: 11,
              cursor: loading ? "wait" : "pointer", fontSize: 15, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              background: loading ? "rgba(59,130,246,0.42)" : btnGrad,
              color: "#fff", letterSpacing: 0.3,
              boxShadow: loading ? "none" : btnShadow,
              transition: "all 0.22s",
            }}
            onMouseEnter={e => { if (!loading) { e.target.style.boxShadow = "0 8px 30px rgba(59,130,246,0.52)"; e.target.style.transform = "translateY(-1px)"; } }}
            onMouseLeave={e => { e.target.style.boxShadow = btnShadow; e.target.style.transform = "none"; }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" style={{ animation: "ztSpin 1s linear infinite" }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" fill="none"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round"/>
                </svg>
                {mode === "login" ? "Signing in..." : "Creating account..."}
              </span>
            ) : (
              mode === "login" ? "Sign In" : "Create Account"
            )}
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: t.textSub, marginTop: 16, marginBottom: 0, transition: "color 0.35s" }}>
            {mode === "login" ? (
              <>Don't have access yet?{" "}
                <span onClick={() => { setMode("signup"); setError(""); }}
                  style={{ color: BLUE_LIGHT, fontWeight: 600, cursor: "pointer" }}>Sign Up</span>
              </>
            ) : (
              <>Already have an account?{" "}
                <span onClick={() => { setMode("login"); setError(""); }}
                  style={{ color: BLUE_LIGHT, fontWeight: 600, cursor: "pointer" }}>Log In</span>
              </>
            )}
          </p>
        </div>

        <p style={{ textAlign: "center", fontSize: 11.5, color: t.footer, marginTop: 22, marginBottom: 0, transition: "color 0.35s" }}>
          Copyright &copy; 2025 ZuriTrack. All Rights Reserved.
        </p>
      </div>

      <style>{`
        @keyframes ztSpin   { to { transform: rotate(360deg); } }
        @keyframes ztFadeUp { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ztFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ztBounce { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-7px); } }
        @keyframes ztDrift1 {
          0%   { transform: translate(0px,   0px) rotate(0deg)   scale(1);    }
          25%  { transform: translate(30px, -42px) rotate(90deg)  scale(1.09); }
          50%  { transform: translate(-20px, 24px) rotate(180deg) scale(0.91); }
          75%  { transform: translate(15px,  32px) rotate(270deg) scale(1.06); }
          100% { transform: translate(0px,   0px) rotate(360deg) scale(1);    }
        }
        @keyframes ztDrift2 {
          0%   { transform: translate(0px,   0px) rotate(0deg)   scale(1);    }
          33%  { transform: translate(-34px, 26px) rotate(120deg) scale(1.13); }
          66%  { transform: translate(22px, -30px) rotate(240deg) scale(0.87); }
          100% { transform: translate(0px,   0px) rotate(360deg) scale(1);    }
        }
        @keyframes ztFloat {
          0%, 100% { transform: translateY(0px)  rotate(0deg)  scale(1);    }
          50%      { transform: translateY(-32px) rotate(22deg) scale(1.09); }
        }
        @keyframes ztPulse {
          0%, 100% { transform: scale(1)    rotate(0deg);   }
          50%      { transform: scale(1.28) rotate(180deg); }
        }
        input::placeholder { color: rgba(180,190,210,0.4) !important; }
      `}</style>
    </div>
  );
}
