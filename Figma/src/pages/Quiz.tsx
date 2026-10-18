import { useState } from "react"
import Shell from "../components/ui/Shell"
import Icon from "../components/ui/Icon"
import { questions } from "../appData"

export default function Quiz({
  onBack,
  onComplete,
}: {
  onBack: () => void
  onComplete: (answers: number[]) => void
}) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const question = questions[index]
  const selected = answers[index]
  const percent = ((index + 1) / questions.length) * 100

  function choose(optionIndex: number) {
    const next = [...answers]
    next[index] = optionIndex
    setAnswers(next)
  }

  function previous() {
    if (index === 0) onBack()
    else setIndex(index - 1)
  }

  function next() {
    if (selected === undefined) return
    if (index === questions.length - 1) onComplete(answers)
    else {
      setIndex(index + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <Shell progress={percent}>
      <section className="quiz-layout">
        <aside className="quiz-aside">
          <p className="section-kicker">Your Rent Mate profile</p>
          <h2>Little choices tell us a lot.</h2>
          <p>
            We turn your everyday preferences into meaningful, explainable
            matches.
          </p>
          <div className="quiz-metrics">
            <span>
              <b>{String(index + 1).padStart(2, "0")}</b> current
            </span>
            <span>
              <b>{String(questions.length).padStart(2, "0")}</b> total
            </span>
          </div>
          <div className="aside-quote">
            “Compatibility is not about being identical. It’s about knowing
            where you naturally align.”
          </div>
        </aside>
        <div className="question-panel">
          <div className="question-nav">
            <button onClick={previous}>
              <Icon name="back" /> Back
            </button>
            <span>
              {index + 1} of {questions.length}
            </span>
          </div>
          <p className="question-eyebrow">{question.eyebrow}</p>
          <h1>{question.title}</h1>
          <p className="question-hint">{question.hint}</p>
          <div
            className={`option-grid ${
              question.options.some((option) => option.tone)
                ? "colour-options"
                : ""
            }`}
          >
            {question.options.map((option, optionIndex) => (
              <button
                key={option.title}
                className={`option-card ${
                  selected === optionIndex ? "selected" : ""
                }`}
                onClick={() => choose(optionIndex)}
              >
                {option.tone ? (
                  <span
                    className="colour-swatch"
                    style={{ background: option.tone }}
                  />
                ) : (
                  <span className="option-letter">
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                )}
                <span className="option-copy">
                  <b>{option.title}</b>
                  {option.detail && <small>{option.detail}</small>}
                </span>
                <span className="option-check">
                  <Icon name="check" size={15} />
                </span>
              </button>
            ))}
          </div>
          <div className="quiz-footer">
            <span>
              {selected === undefined
                ? "Choose one to continue"
                : "Looking good — ready when you are"}
            </span>
            <button
              className="primary-button"
              disabled={selected === undefined}
              onClick={next}
            >
              {index === questions.length - 1 ? "See my matches" : "Continue"}{" "}
              <Icon name="arrow" />
            </button>
          </div>
        </div>
      </section>
    </Shell>
  )
}