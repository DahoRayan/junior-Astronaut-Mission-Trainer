from fastapi import APIRouter, HTTPException

from app.schemas.models import (
    AssistantAnswerRequest,
    AssistantAnswerResponse,
    AssistantQuestion,
    AssistantQuestionsRequest,
    AssistantQuestionsResponse,
    Explanation,
    ExplanationRule,
    ExplanationSource,
)

router = APIRouter()


def _explanation(snapshot) -> Explanation:
    return Explanation(
        rules_fired=[
            ExplanationRule(
                rule_id="R-RESOURCE-CHECK",
                text="Mission Buddy checks the current resources before answering.",
            )
        ],
        inputs={
            "sol": snapshot.sol,
            "perspective_id": snapshot.perspective_id,
            "scene_id": snapshot.scene_id,
        },
        sources=[ExplanationSource(name="Mission rules", kind="simulated")],
    )


@router.post("/assistant/questions", response_model=AssistantQuestionsResponse)
def questions(_: AssistantQuestionsRequest) -> AssistantQuestionsResponse:
    return AssistantQuestionsResponse(
        questions=[
            AssistantQuestion(id="resource-balance", text="Which resource should I protect first?"),
            AssistantQuestion(id="event-risk", text="What does this event mean for the crew?"),
            AssistantQuestion(id="next-choice", text="What should I check before my next choice?"),
        ]
    )


@router.post("/assistant/answer", response_model=AssistantAnswerResponse)
def answer(request: AssistantAnswerRequest) -> AssistantAnswerResponse:
    answers = {
        "resource-balance": (
            "Check oxygen, power, and shielding together. A safe mission needs all three."
        ),
        "event-risk": (
            "Look at the event severity and your shielding. Higher severity means you should "
            "plan carefully."
        ),
        "next-choice": "Check what you gain and what you spend. Then look for any delayed cost.",
    }
    if request.question_id not in answers:
        raise HTTPException(status_code=404, detail="Unknown question_id.")
    return AssistantAnswerResponse(
        answer=answers[request.question_id],
        fact=None,
        explanation=_explanation(request.snapshot),
        data_source="simulated",
    )
