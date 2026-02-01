import { useTranslation } from "react-i18next";

export function FormbricksBranding() {
  const { t } = useTranslation();
  return (
    <a
      href="https://nust.edu.iq"
      target="_blank"
      tabIndex={-1}
      className="fb-flex fb-justify-center"
      rel="noopener">
      <p className="fb-text-signature fb-text-xs">
        {t("common.powered_by")}{" "}
        <b>
          <span className="fb-text-branding-text hover:fb-text-signature">NUST</span>
        </b>
      </p>
    </a>
  );
}
