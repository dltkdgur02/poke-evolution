import { useState, useEffect } from 'react';
import axios from 'axios';
import './GuessingGame.css';

const MAX_POKEMON_ID = 898; // 8세대까지

// App.tsx에서 한글 이름 찾는 함수를 가져오거나, 여기에 다시 정의합니다.
const findKoreanName = (data: any, fallbackName: string) => data.names.find((n: any) => n.language.name === 'ko')?.name || fallbackName;

interface GameProps {
    onGameComplete: (score: number) => void;
}

function GuessingGame({ onGameComplete }: GameProps) {
    const [question, setQuestion] = useState<any>(null);
    const [choices, setChoices] = useState<any[]>([]);
    const [gameState, setGameState] = useState<'playing' | 'revealed' | 'finished'>('playing');
    const [userChoice, setUserChoice] = useState<{ name: string; isCorrect: boolean } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [score, setScore] = useState(0);
    const [questionCount, setQuestionCount] = useState(1);

    const fetchNewQuestion = async () => {
        setIsLoading(true);
        setUserChoice(null);
        setGameState('playing');

        try {
            const randomIds = new Set<number>();
            while (randomIds.size < 4) {
                randomIds.add(Math.floor(Math.random() * MAX_POKEMON_ID) + 1);
            }
            const [correctId, ...wrongIds] = Array.from(randomIds);

            const speciesRes = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${correctId}`);
            const flavorText = speciesRes.data.flavor_text_entries.reverse().find((e: any) => e.language.name === 'ko')?.flavor_text.replace(/\s+/g, ' ') || '도감 설명을 찾을 수 없습니다.';

            const choicePromises = [correctId, ...wrongIds].map(id => axios.get(`https://pokeapi.co/api/v2/pokemon-species/${id}`));
            const choiceResponses = await Promise.all(choicePromises);

            const choiceData = choiceResponses.map(res => ({
                koreanName: findKoreanName(res.data, res.data.name),
                sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${res.data.id}.png`,
            }));

            setQuestion({ ...choiceData[0], flavorText });
            setChoices(choiceData.sort(() => Math.random() - 0.5));
        } catch (error) {
            console.error("Error fetching question:", error);
            fetchNewQuestion();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNewQuestion();
    }, []);

    const handleGuess = (choiceName: string) => {
        const isCorrect = choiceName === question.koreanName;
        if (isCorrect) {
            setScore(prev => prev + 10);
        }
        setUserChoice({ name: choiceName, isCorrect });
        setGameState('revealed');
    };

    const handleNext = () => {
        if (questionCount < 10) {
            setQuestionCount(prev => prev + 1);
            fetchNewQuestion();
        } else {
            setGameState('finished');
        }
    };

    if (gameState === 'finished') {
        return (
            <div className="game-container">
                <h2>게임 종료!</h2>
                <p style={{ fontSize: '24px', margin: '20px 0' }}>최종 점수: <strong>{score}</strong>점</p>
                <button className="new-game-btn" onClick={() => onGameComplete(score)}>
                    점수 기록하고 랭킹 보기
                </button>
            </div>
        );
    }

    if (isLoading || !question) {
        return <div className="game-container"><p>새로운 문제를 불러오는 중...</p></div>;
    }
    return (
        <div className="game-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>문제 {questionCount}/10</span>
                <span>점수: {score}</span>
            </div>
            <h3>다음 설명에 해당하는 포켓몬은?</h3>
            <div className="flavor-text-box">"{question.flavorText}"</div>
            <div className="choices-grid">
                {choices.map(choice => (
                    <button
                        key={choice.koreanName}
                        className={`choice-btn ${gameState === 'revealed' && (choice.koreanName === question.koreanName ? 'correct' : (userChoice?.name === choice.koreanName ? 'wrong' : ''))}`}
                        onClick={() => handleGuess(choice.koreanName)}
                        disabled={gameState === 'revealed'}
                    >
                        {choice.koreanName}
                    </button>
                ))}
            </div>
            {gameState === 'revealed' && (
                <div className="reveal-section">
                    <img src={question.sprite} alt={question.koreanName} />
                    <h3>정답: {question.koreanName}</h3>
                    <button className="new-game-btn" onClick={handleNext}>
                        {questionCount < 10 ? '다음 문제' : '결과 보기'}
                    </button>
                </div>
            )}
        </div>
    );
}
export default GuessingGame;