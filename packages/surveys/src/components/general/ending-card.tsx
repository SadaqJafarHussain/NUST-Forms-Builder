import { useEffect } from "preact/hooks";
import { useTranslation } from "react-i18next";
import { type TJsEnvironmentStateSurvey } from "@formbricks/types/js";
import { type TResponseData, type TResponseVariables } from "@formbricks/types/responses";
import { type TSurveyEndScreenCard, type TSurveyRedirectUrlCard } from "@formbricks/types/surveys/types";
import { SubmitButton } from "@/components/buttons/submit-button";
import { Headline } from "@/components/general/headline";
import { LoadingSpinner } from "@/components/general/loading-spinner";
import { QuestionMedia } from "@/components/general/question-media";
import { Subheader } from "@/components/general/subheader";
import { ScrollableContainer } from "@/components/wrappers/scrollable-container";
import { getLocalizedValue } from "@/lib/i18n";
import { replaceRecallInfo } from "@/lib/recall";

interface EndingCardProps {
  survey: TJsEnvironmentStateSurvey;
  endingCard: TSurveyEndScreenCard | TSurveyRedirectUrlCard;
  isRedirectDisabled: boolean;
  isResponseSendingFinished: boolean;
  autoFocusEnabled: boolean;
  isCurrent: boolean;
  languageCode: string;
  responseData: TResponseData;
  variablesData: TResponseVariables;
  onOpenExternalURL?: (url: string) => void | Promise<void>;
  isPreviewMode: boolean;
}

export function EndingCard({
  survey,
  endingCard,
  isRedirectDisabled,
  isResponseSendingFinished,
  autoFocusEnabled,
  isCurrent,
  languageCode,
  responseData,
  variablesData,
  onOpenExternalURL,
  isPreviewMode,
}: EndingCardProps) {
  const { t } = useTranslation();
  const media =
    endingCard.type === "endScreen" && (endingCard.imageUrl ?? endingCard.videoUrl) ? (
      <QuestionMedia imgUrl={endingCard.imageUrl} videoUrl={endingCard.videoUrl} />
    ) : null;

  const checkmark = (
    <div className="fb-flex fb-flex-col fb-items-center fb-justify-center fb-gap-4 fb-pb-4">
      {/* NUST logo + gold ring */}
      <div
        style={{ padding: "4px", borderRadius: "50%", backgroundColor: "#f4bf00", display: "inline-flex" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 6,
          }}>
          <img
            src="/images/logo.png"
            alt="NUST"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
      </div>
      {/* Green checkmark badge */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          backgroundColor: "#16a34a18",
          border: "2px solid #16a34a40",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          color: "#16a34a",
          fontWeight: "bold",
        }}>
        ✓
      </div>
      {/* Status badge */}
      <span
        style={{
          backgroundColor: "#16a34a18",
          color: "#15803d",
          border: "1px solid #16a34a40",
          borderRadius: 999,
          padding: "2px 14px",
          fontSize: 13,
          fontWeight: 600,
        }}>
        تم الإرسال بنجاح
      </span>
      {/* Gold divider */}
      <div style={{ width: 48, height: 3, borderRadius: 999, backgroundColor: "#f4bf00" }} />
    </div>
  );

  const processAndRedirect = (urlString: string) => {
    try {
      const url = replaceRecallInfo(urlString, responseData, variablesData);
      if (url && new URL(url)) {
        if (onOpenExternalURL) {
          onOpenExternalURL(url);
        } else {
          window.top?.location.replace(url);
        }
      }
    } catch (error) {
      console.error("Invalid URL after recall processing:", error);
    }
  };

  const handleSubmit = () => {
    if (!isRedirectDisabled && endingCard.type === "endScreen" && endingCard.buttonLink) {
      processAndRedirect(endingCard.buttonLink);
    }
  };

  useEffect(() => {
    if (isCurrent) {
      if (!isRedirectDisabled && endingCard.type === "redirectToUrl" && endingCard.url) {
        processAndRedirect(endingCard.url);
      }
    }

    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSubmit();
      }
    };

    if (isCurrent && survey.type === "link") {
      document.addEventListener("keydown", handleEnter);
    } else {
      document.removeEventListener("keydown", handleEnter);
    }

    return () => {
      document.removeEventListener("keydown", handleEnter);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps -- we only want to run this effect when isCurrent changes
  }, [isCurrent]);

  return (
    <ScrollableContainer>
      <div className="fb-text-center">
        {isResponseSendingFinished ? (
          <>
            {endingCard.type === "endScreen" && (
              <div>
                {media ?? checkmark}
                <div>
                  <Headline
                    alignTextCenter
                    headline={replaceRecallInfo(
                      getLocalizedValue(endingCard.headline, languageCode),
                      responseData,
                      variablesData
                    )}
                    questionId="EndingCard"
                  />
                  <Subheader
                    subheader={replaceRecallInfo(
                      getLocalizedValue(endingCard.subheader, languageCode),
                      responseData,
                      variablesData
                    )}
                    questionId="EndingCard"
                  />
                  {endingCard.buttonLabel ? (
                    <div className="fb-mt-6 fb-flex fb-w-full fb-flex-col fb-items-center fb-justify-center fb-space-y-4">
                      <SubmitButton
                        buttonLabel={replaceRecallInfo(
                          getLocalizedValue(endingCard.buttonLabel, languageCode),
                          responseData,
                          variablesData
                        )}
                        isLastQuestion={false}
                        focus={isCurrent ? autoFocusEnabled : false}
                        onClick={handleSubmit}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            )}
            {endingCard.type === "redirectToUrl" && (
              <>
                {isPreviewMode ? (
                  <div>
                    <Headline
                      alignTextCenter
                      headline={t("common.respondents_will_not_see_this_card")}
                      questionId="EndingCard"
                    />
                    <Subheader
                      subheader={t("common.they_will_be_redirected_immediately")}
                      questionId="EndingCard"
                    />
                  </div>
                ) : (
                  <div className="fb-my-3">
                    <LoadingSpinner />
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <div className="fb-my-3">
              <LoadingSpinner />
            </div>
            <h1 style={{ color: "#1b335f" }}>جارٍ إرسال ردك…</h1>
          </>
        )}
      </div>
    </ScrollableContainer>
  );
}
