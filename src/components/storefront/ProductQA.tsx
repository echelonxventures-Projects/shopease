"use client";

import { useEffect, useState } from "react";
import { listQuestions, createQuestion, createAnswer } from "@/server/actions/commerce-actions";
import { toast } from "sonner";

interface ProductQAProps {
  productId: string;
}

interface QAAnswer {
  id: string;
  answer: string;
  isSeller: boolean;
  createdAt: string | Date;
}

interface QAQuestion {
  id: string;
  question: string;
  userName: string;
  answers: QAAnswer[];
}

export function ProductQA({ productId }: ProductQAProps) {
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [answerMap, setAnswerMap] = useState<Record<string, string>>({});

  const fetch = () => {
    setLoading(true);
    listQuestions(productId)
      .then(setQuestions)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [productId]);

  const handleAsk = async () => {
    if (!question.trim()) return toast.error("Question cannot be empty");
    try {
      await createQuestion({ productId, question });
      toast.success("Question submitted");
      setQuestion("");
      setShowForm(false);
      fetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
  };

  const handleAnswer = async (qId: string) => {
    const text = answerMap[qId];
    if (!text?.trim()) return toast.error("Answer cannot be empty");
    try {
      await createAnswer({ questionId: qId, answer: text, isSeller: true });
      toast.success("Answer submitted");
      setAnswerMap({ ...answerMap, [qId]: "" });
      fetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Questions & Answers</h3>
        <button onClick={() => setShowForm(!showForm)} className="text-blue-600 hover:underline">
          {showForm ? "Cancel" : "Ask a Question"}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask your question..."
            className="w-full border rounded-lg px-3 py-2 min-h-[80px]"
          />
          <button onClick={handleAsk} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Submit Question
          </button>
        </div>
      )}

      {loading ? <p className="text-gray-500">Loading...</p>
        : questions.length === 0 ? <p className="text-gray-500">No questions yet. Be the first to ask!</p>
        : questions.map((q) => (
          <div key={q.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">Q:</span>
              <div>
                <p className="font-medium">{q.question}</p>
                <p className="text-xs text-gray-500 mt-1">by {q.userName}</p>
              </div>
            </div>

            {q.answers.map((a) => (
              <div key={a.id} className="flex items-start gap-2 ml-6">
                <span className={a.isSeller ? "text-green-600 font-bold" : "text-gray-600 font-bold"}>
                  {a.isSeller ? "A*" : "A"}:
                </span>
                <div>
                  <p className="text-gray-700">{a.answer}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {a.isSeller ? "Seller" : "Customer"} • {new Date(a.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
            ))}

            <div className="ml-6 mt-2">
              <div className="flex gap-2">
                <input
                  value={answerMap[q.id] || ""}
                  onChange={(e) => setAnswerMap({ ...answerMap, [q.id]: e.target.value })}
                  placeholder="Write an answer..."
                  className="flex-1 border rounded-lg px-3 py-1 text-sm"
                />
                <button
                  onClick={() => handleAnswer(q.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700"
                >
                  Answer
                </button>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
