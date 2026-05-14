"use client";

import { FormEvent, useState } from "react";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onVerified: (identity: string) => void;
};

export function AuthModal({ open, onClose, onVerified }: AuthModalProps) {
  const [identity, setIdentity] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  function handleSendCode() {
    if (!identity.trim()) {
      setError("请输入手机号或邮箱。");
      return;
    }
    setCodeSent(true);
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identity.trim()) {
      setError("请输入手机号或邮箱。");
      return;
    }
    if (!codeSent) {
      handleSendCode();
      return;
    }
    if (code.trim().length < 4) {
      setError("请输入验证码。演示阶段任意 4 位以上即可。");
      return;
    }
    onVerified(identity.trim());
  }

  return (
    <div className="ielts-auth-backdrop" role="presentation">
      <div className="ielts-auth-modal" role="dialog" aria-modal="true" aria-labelledby="ieltsAuthTitle">
        <button className="ielts-auth-close" type="button" onClick={onClose} aria-label="关闭登录弹窗">
          ×
        </button>
        <p className="ielts-eyebrow">Account Required</p>
        <h2 id="ieltsAuthTitle">登录后解锁深度报告</h2>
        <p className="ielts-auth-lede">用于保存报告、同步购买额度，并防止同一报告重复扣费。</p>

        <form className="ielts-auth-form" onSubmit={handleSubmit}>
          <label htmlFor="ielts-auth-identity">
            手机号或邮箱
            <input
              id="ielts-auth-identity"
              name="identity"
              type="text"
              value={identity}
              onChange={(event) => setIdentity(event.target.value)}
              placeholder="手机号 / 邮箱"
              autoComplete="username"
            />
          </label>

          {codeSent ? (
            <label htmlFor="ielts-auth-code">
              验证码
              <input
                id="ielts-auth-code"
                name="verificationCode"
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="输入验证码"
                autoComplete="one-time-code"
              />
            </label>
          ) : null}

          {error ? <p className="ielts-auth-error">{error}</p> : null}

          <div className="ielts-auth-actions">
            <button className="ielts-secondary-button" type="button" onClick={handleSendCode}>
              {codeSent ? "重新发送" : "发送验证码"}
            </button>
            <button className="ielts-primary-button" type="submit">
              {codeSent ? "登录并继续" : "下一步"}
            </button>
          </div>
        </form>

        <p className="ielts-auth-note">V1 推荐验证码登录。微信授权、App 登录和小程序 OpenID 后续接入同一账户体系。</p>
      </div>
    </div>
  );
}
