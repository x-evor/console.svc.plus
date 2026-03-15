"use client";

import React from "react";
import Footer from "../../components/Footer";
import UnifiedNavigation from "../../components/UnifiedNavigation";
import { useLanguage } from "../../i18n/LanguageProvider";

type PolicySection = {
  title: string;
  body?: string[];
  bullets?: string[];
};

type PolicyContent = {
  title: string;
  subtitle: string;
  effective: string;
  updated: string;
  overview: string[];
  sections: PolicySection[];
  contactTitle: string;
  contactBody: string;
  contactEmailLabel: string;
};

const zhContent: PolicyContent = {
  title: "隐私政策",
  subtitle:
    "本政策以 Xstream 产品为重点，说明登录、Sync、诊断日志与 Secure Tunnel 连接相关的数据处理方式；同时也适用于 svc.plus 网站与后续相关产品服务。",
  effective: "生效日期：2026年3月15日",
  updated: "最后更新：2026年3月15日",
  overview: [
    "我们遵循最小化收集原则，只处理为提供服务、保障安全、完成支付、处理支持请求和维护运行稳定所必需的数据。",
    "对于 Xstream，核心连接功能无需登录即可使用。登录仅在您主动使用 Sync 或账户相关能力时需要。",
    "我们不会出售您的个人信息，也不会为了广告目的共享您的个人信息。",
  ],
  sections: [
    {
      title: "1. 适用范围",
      body: [
        "本政策适用于您访问 svc.plus 网站、使用账户服务、提交工单、完成支付，以及使用 Xstream 等相关产品时的数据处理活动。",
        "如果某项服务另有单独的补充政策或企业协议，则该补充文件在其适用范围内优先。",
      ],
    },
    {
      title: "2. 我们收集哪些信息",
      body: ["我们可能收集下列类别的信息："],
      bullets: [
        "账户信息：例如邮箱地址、用户名、认证状态，以及您主动提供的个人资料信息。",
        "支付与订单信息：订阅状态、订单编号、账单结果等。支付卡数据由第三方支付服务商处理，我们不直接保存完整卡号或安全码。",
        "设备与访问数据：例如 IP 地址、浏览器类型、设备类型、系统版本、访问时间、页面请求以及基础安全日志。",
        "支持与沟通内容：例如您发送给我们的邮件、反馈、问题描述、附件和排障所需的最小必要信息。",
        "Xstream 本地配置数据：例如节点名称、连接模式、运行状态和本地配置文件。这些数据主要保存在您的设备上，用于提供应用功能。",
        "Xstream Secure Tunnel 连接数据：例如您选择的连接模式、节点标识、连接状态、持续时间、延迟、基础运行指标和必要的错误信息。这些信息主要用于在设备本地显示状态和协助排障。",
        "Xstream 可选同步数据：当您主动登录并启用 Sync 时，我们会处理为跨设备同步所需的配置版本、订阅元数据与服务端下发的配置内容。",
        "诊断数据：Xstream 的本地 telemetry 默认仅保存在本地设置中，不会自动上传；如您主动联系支持并提供日志或诊断文件，我们才会接收相应内容。",
      ],
    },
    {
      title: "3. Xstream 的特别说明",
      bullets: [
        "Xstream 的核心 Secure Tunnel 功能无需登录即可使用。",
        "Sync 为可选功能，仅在您主动登录账户后启用，用于跨设备同步配置或订阅状态。",
        "登录相关数据仅用于身份验证、会话维持、可选 MFA 和同步能力，不是使用核心连接功能的前提。",
        "我们要求产品日志避免记录密码、令牌、完整支付信息等高敏感数据。",
        "为排障目的，应用可能在您的设备本地生成运行日志、错误信息与连接状态信息；这些内容默认不会自动上传给我们。",
        "当您主动使用支持流程并共享日志、截图或配置片段时，我们仅将其用于问题诊断、修复和支持沟通。",
      ],
    },
    {
      title: "4. 我们如何使用信息",
      bullets: [
        "创建和管理账户、完成登录验证以及执行可选的多因素认证流程。",
        "提供网站、下载、订阅、支付结算、支持和产品交付能力。",
        "在 Xstream 中保存您的本地配置状态、处理可选 Sync、并维持连接相关功能。",
        "监测服务可用性、识别滥用行为、预防欺诈、保障系统和账户安全。",
        "回应您的咨询、支持请求、退款沟通和产品反馈。",
        "履行法律义务、解决争议并执行我们的服务条款。",
      ],
    },
    {
      title: "5. 我们如何共享信息",
      body: ["我们不会出售您的个人信息。我们仅在以下必要情形下共享数据："],
      bullets: [
        "基础设施与托管服务商：用于提供网站、API、数据库、对象存储和运行环境。",
        "支付服务商：用于处理订阅、支付、账单和退款。",
        "身份验证与安全服务：用于登录、会话管理、风控与访问控制。",
        "法律与合规要求：当法律、法规、法院命令或合法执法请求要求我们披露数据时。",
        "业务保护：为保护 svc.plus、用户或公众的合法权益、安全与系统完整性所必需时。",
      ],
    },
    {
      title: "6. 数据保存与删除",
      bullets: [
        "我们会在实现服务目的、履行合同义务、满足法定义务和处理争议所需期间内保留数据。",
        "账户关闭后，我们会在合理期限内删除或匿名化不再需要的数据，法律要求保留的记录除外。",
        "Xstream 保存在您设备本地的配置、日志和缓存，可由您在应用内删除、重置或卸载应用后移除。",
      ],
    },
    {
      title: "7. 您的权利与选择",
      bullets: [
        "您可以请求访问、更正、导出或删除与您相关的个人数据，具体取决于适用法律。",
        "您可以停止使用可选 Sync，并在需要时退出登录或删除本地配置。",
        "如果您希望删除账户数据或提出隐私请求，可通过下方联系方式与我们联系。",
      ],
    },
    {
      title: "8. 安全措施",
      body: [
        "我们采用合理的技术和组织措施保护数据安全，包括传输层加密、访问控制、最小权限、日志控制和基础设施安全措施。",
        "但任何互联网传输或电子存储方式都无法保证绝对安全，因此我们无法承诺百分之百的安全性。",
      ],
    },
    {
      title: "9. 儿童隐私",
      body: [
        "我们的服务面向普通开发者和专业用户，不以儿童为目标人群。若您认为未成年人在未经适当授权的情况下向我们提供了个人信息，请联系我们处理。",
      ],
    },
    {
      title: "10. 政策更新",
      body: [
        "我们可能会不时更新本政策。更新后，我们将在本页面发布新的版本，并更新页面顶部的日期。重大变更将通过合理方式提示。",
      ],
    },
  ],
  contactTitle: "联系我们",
  contactBody:
    "如需提交隐私相关请求、删除请求或 App Store 审核所需说明，请通过以下邮箱联系我们：",
  contactEmailLabel: "隐私与支持邮箱",
};

const enContent: PolicyContent = {
  title: "Privacy Policy",
  subtitle:
    "This policy is centered on Xstream and explains how we handle login, Sync, diagnostic logs, and Secure Tunnel connection data. It also applies to the svc.plus website and future related services.",
  effective: "Effective Date: March 15, 2026",
  updated: "Last Updated: March 15, 2026",
  overview: [
    "We follow a data-minimization approach and only process information needed to provide services, secure our systems, complete payments, respond to support requests, and maintain operational reliability.",
    "For Xstream, core connection features are available without login. Login is only required when you choose to use Sync or account-related features.",
    "We do not sell personal information and we do not share personal information for advertising purposes.",
  ],
  sections: [
    {
      title: "1. Scope",
      body: [
        "This policy applies when you visit svc.plus, use account services, submit support requests, complete payments, or use related products such as Xstream.",
        "If a specific service is governed by a supplemental policy or enterprise agreement, that document controls within its applicable scope.",
      ],
    },
    {
      title: "2. Information We Collect",
      body: ["We may collect the following categories of information:"],
      bullets: [
        "Account information, such as email address, username, authentication state, and profile details you choose to provide.",
        "Payment and order information, such as subscription status, order identifiers, billing outcomes, and refund records. Full payment card data is handled by third-party payment providers, not stored directly by us.",
        "Device and access data, such as IP address, browser type, device type, operating system version, access times, page requests, and baseline security logs.",
        "Support and communication content, such as messages, attachments, issue descriptions, and the minimum information needed to investigate a request.",
        "Xstream local configuration data, such as node names, connection mode, runtime state, and local config files. This data is primarily stored on your device to provide app functionality.",
        "Xstream Secure Tunnel connection data, such as the selected connection mode, node identifier, connection state, duration, latency, basic runtime metrics, and necessary error details. This information is mainly used to display status on your device and support troubleshooting.",
        "Xstream optional sync data, such as config version, subscription metadata, and server-provided config content, when you actively sign in and use Sync.",
        "Diagnostic data. Xstream telemetry is local-only by default and is not automatically uploaded. We only receive logs or diagnostic files when you intentionally share them with support.",
      ],
    },
    {
      title: "3. Xstream-Specific Notes",
      bullets: [
        "Xstream core Secure Tunnel features can be used without creating or signing into an account.",
        "Sync is optional and is only enabled when you intentionally sign in to use cross-device configuration or subscription features.",
        "Login-related data is used for authentication, session continuity, optional MFA, and Sync. It is not required to use core connection features.",
        "We require the product to avoid logging passwords, tokens, or complete payment credentials in normal application logs.",
        "For troubleshooting, the app may create local runtime logs, error details, and connection status information on your device. These files are not automatically uploaded to us.",
        "When you intentionally share logs, screenshots, or config excerpts with support, we use them only to investigate, fix, and communicate about the reported issue.",
      ],
    },
    {
      title: "4. How We Use Information",
      bullets: [
        "To create and manage accounts, perform login verification, and support optional multi-factor authentication.",
        "To provide the website, downloads, subscriptions, payment processing, support, and product delivery.",
        "To maintain Xstream local configuration state, process optional Sync, and support connection-related features.",
        "To monitor availability, detect abuse, prevent fraud, and protect system and account security.",
        "To respond to your questions, support requests, refunds, and product feedback.",
        "To comply with legal obligations, resolve disputes, and enforce our Terms of Service.",
      ],
    },
    {
      title: "5. How We Share Information",
      body: [
        "We do not sell personal information. We share data only when necessary, including with:",
      ],
      bullets: [
        "Infrastructure and hosting providers used to operate the website, APIs, databases, storage, and runtime environment.",
        "Payment providers used to process subscriptions, billing, and refunds.",
        "Authentication and security providers used for login, session management, risk control, and access protection.",
        "Authorities or counterparties where disclosure is required by applicable law, regulation, court order, or lawful request.",
        "Parties involved in protecting svc.plus, our users, or the public where needed to preserve rights, safety, or system integrity.",
      ],
    },
    {
      title: "6. Retention and Deletion",
      bullets: [
        "We retain data for as long as needed to provide services, fulfill contractual commitments, meet legal obligations, and resolve disputes.",
        "After account closure, we delete or anonymize data that is no longer needed within a reasonable period, except where retention is required by law.",
        "Xstream configuration files, logs, and caches stored on your device can be removed by deleting local data, resetting the app, or uninstalling the app.",
      ],
    },
    {
      title: "7. Your Rights and Choices",
      bullets: [
        "Depending on applicable law, you may request access to, correction of, export of, or deletion of your personal data.",
        "You may stop using optional Sync and sign out or delete local Xstream configuration at any time.",
        "If you want to submit a deletion request or another privacy request, contact us using the details below.",
      ],
    },
    {
      title: "8. Security Measures",
      body: [
        "We use reasonable technical and organizational safeguards, including transport encryption, access controls, least-privilege practices, log controls, and infrastructure security measures.",
        "No internet transmission or electronic storage method is completely secure, so we cannot guarantee absolute security.",
      ],
    },
    {
      title: "9. Children's Privacy",
      body: [
        "Our services are designed for general developer and professional users and are not directed to children. If you believe a minor provided personal data without appropriate authorization, contact us so we can investigate and take appropriate action.",
      ],
    },
    {
      title: "10. Policy Changes",
      body: [
        "We may update this policy from time to time. When we do, we will publish the updated version on this page and revise the date at the top. Material changes will be communicated by reasonable means.",
      ],
    },
  ],
  contactTitle: "Contact",
  contactBody:
    "To submit a privacy request, deletion request, or information needed for app review, contact us at:",
  contactEmailLabel: "Privacy and support email",
};

function renderSection(section: PolicySection) {
  return (
    <section
      key={section.title}
      className="rounded-2xl border border-surface-border bg-surface p-6"
    >
      <h2 className="mb-4 text-xl font-semibold text-heading">
        {section.title}
      </h2>
      {section.body?.map((paragraph) => (
        <p key={paragraph} className="mb-3 leading-7 text-text-muted">
          {paragraph}
        </p>
      ))}
      {section.bullets ? (
        <ul className="list-disc space-y-3 pl-5 text-text-muted">
          {section.bullets.map((bullet) => (
            <li key={bullet} className="leading-7">
              {bullet}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export default function PrivacyPage() {
  const { language } = useLanguage();
  const isChinese = language === "zh";
  const content = isChinese ? zhContent : enContent;

  return (
    <div className="min-h-screen bg-background text-text transition-colors duration-150 flex flex-col">
      <UnifiedNavigation />

      <main className="flex-1 relative overflow-hidden pt-24 pb-20">
        <div
          className="absolute inset-0 bg-gradient-app-from opacity-20 pointer-events-none"
          aria-hidden
        />

        <div className="relative mx-auto max-w-5xl px-6">
          <div className="mb-10 space-y-5">
            <div className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-sm font-medium text-primary">
              svc.plus
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight text-heading sm:text-5xl">
                {content.title}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-text-muted sm:text-lg">
                {content.subtitle}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted">
              <span>{content.effective}</span>
              <span>{content.updated}</span>
            </div>
          </div>

          <section className="mb-8 rounded-3xl border border-surface-border bg-surface-muted/50 p-6 sm:p-8">
            <div className="space-y-4">
              {content.overview.map((paragraph) => (
                <p key={paragraph} className="leading-7 text-text-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>

          <div className="space-y-6">{content.sections.map(renderSection)}</div>

          <section className="mt-8 rounded-3xl border border-primary/15 bg-primary/5 p-6 sm:p-8">
            <h2 className="mb-3 text-2xl font-semibold text-heading">
              {content.contactTitle}
            </h2>
            <p className="mb-4 leading-7 text-text-muted">
              {content.contactBody}
            </p>
            <p className="text-sm font-medium text-text-muted">
              {content.contactEmailLabel}
            </p>
            <a
              href="mailto:haitaopanhq@gmail.com"
              className="mt-2 inline-flex text-base font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              haitaopanhq@gmail.com
            </a>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
