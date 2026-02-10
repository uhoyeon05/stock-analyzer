import { useEffect, useRef, useState } from 'react';
import './App.css';

const GAME_WIDTH = 500;
const GAME_HEIGHT = 600;
const BALL_RADIUS = 12;
const PADDLE_WIDTH = 110;
const PADDLE_HEIGHT = 14;
const PADDLE_SPEED = 9;

function App() {
  const [ball, setBall] = useState({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    vx: 3.5,
    vy: -4,
  });
  const [paddleX, setPaddleX] = useState((GAME_WIDTH - PADDLE_WIDTH) / 2);
  const [score, setScore] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const pressedKeys = useRef({ left: false, right: false });

  const resetGame = () => {
    setBall({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      vx: 3.5,
      vy: -4,
    });
    setPaddleX((GAME_WIDTH - PADDLE_WIDTH) / 2);
    setScore(0);
    setIsRunning(true);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'ArrowLeft') {
        pressedKeys.current.left = true;
      }
      if (event.key === 'ArrowRight') {
        pressedKeys.current.right = true;
      }
    };

    const onKeyUp = (event) => {
      if (event.key === 'ArrowLeft') {
        pressedKeys.current.left = false;
      }
      if (event.key === 'ArrowRight') {
        pressedKeys.current.right = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const gameLoop = setInterval(() => {
      setPaddleX((prev) => {
        let next = prev;

        if (pressedKeys.current.left) {
          next -= PADDLE_SPEED;
        }
        if (pressedKeys.current.right) {
          next += PADDLE_SPEED;
        }

        return Math.max(0, Math.min(next, GAME_WIDTH - PADDLE_WIDTH));
      });

      setBall((prevBall) => {
        let { x, y, vx, vy } = prevBall;
        let nextX = x + vx;
        let nextY = y + vy;

        if (nextX - BALL_RADIUS <= 0 || nextX + BALL_RADIUS >= GAME_WIDTH) {
          vx *= -1;
          nextX = x + vx;
        }

        if (nextY - BALL_RADIUS <= 0) {
          vy *= -1;
          nextY = y + vy;
        }

        const paddleTop = GAME_HEIGHT - 40;
        const paddleBottom = paddleTop + PADDLE_HEIGHT;
        const paddleHit =
          nextY + BALL_RADIUS >= paddleTop &&
          nextY + BALL_RADIUS <= paddleBottom &&
          nextX >= paddleX &&
          nextX <= paddleX + PADDLE_WIDTH &&
          vy > 0;

        if (paddleHit) {
          vy = -Math.abs(vy) - 0.2;
          const offset = (nextX - (paddleX + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);
          vx += offset * 0.9;
          setScore((prevScore) => prevScore + 1);
        }

        if (nextY - BALL_RADIUS > GAME_HEIGHT) {
          setIsRunning(false);
        }

        return { x: nextX, y: nextY, vx, vy };
      });
    }, 16);

    return () => clearInterval(gameLoop);
  }, [isRunning, paddleX]);

  return (
    <main className="App">
      <h1>공 튀기기 게임</h1>
      <p className="instructions">⬅️ ➡️ 방향키로 패들을 움직여 공을 계속 받아보세요!</p>

      <div className="game-area" aria-label="game area">
        <div
          className="ball"
          style={{
            transform: `translate(${ball.x - BALL_RADIUS}px, ${ball.y - BALL_RADIUS}px)`,
          }}
        />

        <div
          className="paddle"
          style={{ transform: `translate(${paddleX}px, ${GAME_HEIGHT - 40}px)` }}
        />
      </div>

      <div className="hud">
        <strong>점수: {score}</strong>
        {!isRunning && <span className="game-over">게임 오버!</span>}
      </div>

      <button type="button" onClick={resetGame}>
        다시 시작
      </button>
    </main>
  );
}

export default App;
