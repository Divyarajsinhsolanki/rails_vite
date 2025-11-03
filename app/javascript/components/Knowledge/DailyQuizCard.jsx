import React, { useCallback, useEffect, useMemo, useState } from "react";
import BookmarkToggle from "./BookmarkToggle";
import { useKnowledgeBookmarks } from "../../context/KnowledgeBookmarksContext";

const OPEN_TRIVIA_URL = "https://opentdb.com/api.php?amount=1&type=multiple";

function shuffleOptions(options) {
  const array = [...options];
  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }
  return array;
}

function decodeHtml(text) {
  if (!text) return "";
  if (typeof document === "undefined") return text;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

async function fetchOpenTriviaQuiz() {
  const response = await fetch(OPEN_TRIVIA_URL);
  if (!response.ok) {
    throw new Error("Unable to fetch quiz question");
  }
  const data = await response.json();
  const result = data?.results?.[0];
  if (!result) {
    throw new Error("Quiz service returned no questions");
  }

  const correct = decodeHtml(result.correct_answer);
  const options = shuffleOptions(
    [correct, ...(result.incorrect_answers || []).map((answer) => decodeHtml(answer))].filter(Boolean)
  );

  return {
    id: `opentdb-${result.question}`,
    question: decodeHtml(result.question),
    options,
    correctAnswer: correct,
    explanation: result.category ? `Category: ${result.category}` : undefined,
    source: "Open Trivia DB",
    createdAt: new Date().toISOString(),
  };
}

export default function DailyQuizCard({
  cardType = "daily_quiz",
  bookmarkHelpers,
  initialData = null,
  savedBookmark = null,
}) {
  const { getLearningQuizQuestion } = useKnowledgeBookmarks();
  const hasInitialData = Boolean(initialData?.question);
  const [quiz, setQuiz] = useState(() => (hasInitialData ? initialData : null));
  const [status, setStatus] = useState(hasInitialData ? "ready" : "loading");
  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadQuiz = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");
    setSelectedOption(null);
    setResult(null);

    try {
      const bookmarkQuiz = await getLearningQuizQuestion?.();
      if (bookmarkQuiz) {
        setQuiz(bookmarkQuiz);
        setStatus("ready");
        return;
      }

      const fallbackQuiz = await fetchOpenTriviaQuiz();
      setQuiz(fallbackQuiz);
      setStatus("ready");
    } catch (error) {
      console.error("DailyQuizCard: unable to load quiz", error);
      setQuiz(null);
      setStatus("error");
      setErrorMessage(error.message || "We couldn't load a quiz right now.");
    }
  }, [getLearningQuizQuestion]);

  useEffect(() => {
    if (!hasInitialData) {
      loadQuiz();
    }
  }, [hasInitialData, loadQuiz]);

  const bookmarkPayload = useMemo(() => {
    if (!quiz) return null;
    return {
      cardType,
      sourceId: quiz.id || quiz.question,
      payload: quiz,
      title: "Daily Quiz",
      subtitle: quiz.question,
      collectionName: savedBookmark?.collection_name,
      reminderIntervalDays: savedBookmark?.reminder_interval_days,
    };
  }, [cardType, quiz, savedBookmark]);

  const existingBookmark = bookmarkPayload
    ? bookmarkHelpers?.find?.(bookmarkPayload) || savedBookmark
    : savedBookmark;
  const isBookmarked = Boolean(existingBookmark);

  const handleToggle = () => {
    if (!bookmarkPayload) return;
    bookmarkHelpers?.toggle?.({
      ...bookmarkPayload,
      collectionName: existingBookmark?.collection_name ?? bookmarkPayload.collectionName,
    });
  };

  const handleOptionSelect = (option) => {
    if (status !== "ready" || !quiz || result) return;
    setSelectedOption(option);
    setResult(option === quiz.correctAnswer ? "correct" : "incorrect");
  };

  const sourceLabel = useMemo(() => {
    if (!quiz?.source) return null;
    if (quiz.source === "bookmarks") {
      return "Based on your saved learning cards";
    }
    return quiz.source;
  }, [quiz]);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 flex flex-col min-h-[260px]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">📝 Daily Quiz</h2>
          {sourceLabel && <p className="text-xs text-gray-500 mt-1">{sourceLabel}</p>}
        </div>
        <BookmarkToggle
          isBookmarked={isBookmarked}
          onToggle={handleToggle}
          collectionName={existingBookmark?.collection_name}
          disabled={!bookmarkPayload}
        />
      </div>

      {status === "loading" && (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500">Fetching a quiz…</div>
      )}

      {status === "error" && (
        <div className="flex-1 flex flex-col items-start gap-3 text-sm text-red-600">
          <p>{errorMessage}</p>
          <button
            type="button"
            onClick={loadQuiz}
            className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 transition"
          >
            Try again
          </button>
        </div>
      )}

      {status === "ready" && quiz && (
        <div className="flex-1 flex flex-col gap-4">
          <p className="text-sm text-gray-800 font-medium whitespace-pre-line">{quiz.question}</p>
          <div className="space-y-2">
            {quiz.options?.map((option) => {
              const isSelected = selectedOption === option;
              const isCorrect = result === "correct" && option === quiz.correctAnswer;
              const isIncorrect = result === "incorrect" && isSelected;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleOptionSelect(option)}
                  disabled={Boolean(result)}
                  className={`w-full text-left text-sm border rounded-xl px-3 py-2 transition focus:outline-none focus:ring-2 ${
                    isCorrect
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : isIncorrect
                      ? "border-red-500 bg-red-50 text-red-700"
                      : isSelected
                      ? "border-[var(--theme-color)] bg-[var(--theme-color)/0.1] text-[var(--theme-color-dark)]"
                      : "border-gray-200 hover:border-[var(--theme-color)]"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            {result ? (
              <span className={result === "correct" ? "text-emerald-600" : "text-red-600"}>
                {result === "correct" ? "Nice! That's correct." : `Correct answer: ${quiz.correctAnswer}`}
              </span>
            ) : (
              <span>Choose the best answer.</span>
            )}
            <button
              type="button"
              onClick={loadQuiz}
              disabled={status === "loading"}
              className="text-[var(--theme-color)] font-medium disabled:opacity-50"
            >
              New quiz
            </button>
          </div>

          {quiz.explanation && result && (
            <div className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
              {quiz.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
