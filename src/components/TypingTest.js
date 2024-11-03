import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import UserModal from "./UserModal";
import UserDetailsCard from "./UserDetails";

const backendUrl = process.env.REACT_APP_API_URL;

console.log("REACT_APP_API_URL:", process.env.REACT_APP_API_URL);

console.log("backendUrl:", backendUrl);

const TypingTest = () => {
  const [givenText, setGivenText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const [halfTime, setHalfTime] = useState(120); // 2 minutes default
  const [breakTime, setBreakTime] = useState(30); // 30 seconds default
  const [timeLeft, setTimeLeft] = useState(120);
  const [isBreak, setIsBreak] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showModal, setShowModal] = useState(true);
  const [enableEditor, setEnableEditor] = useState(false);
  // TODO: ui change on user submit -> show a card containing user details
  const [testHistory, setTestHistory] = useState([]);
  // const [showTimeSettings, setShowTimeSettings] = useState(false);
  const [charactersTyped, setCharactersTyped] = useState(0);
  const timerRef = useRef(null);
  const mistakeTracker = useRef(null);
  const [firstHalfStats, setFirstHalfStats] = useState(null);
  const [secondHalfStats, setSecondHalfStats] = useState(null);
  const [isSecondHalf, setIsSecondHalf] = useState(false);
  const [userId, setUserId] = useState(null);
  const [metricsInterval, setMetricsInterval] = useState(null);
  const [currentMetrics, setCurrentMetrics] = useState({
    firstHalf: {
      intervals: [],
      totalMistakes: 0,
      totalCharactersTyped: 0,
    },
    secondHalf: {
      intervals: [],
      totalMistakes: 0,
      totalCharactersTyped: 0,
    },
  });

  useEffect(() => {
    fetchRandomText();
    fetchSettings();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${backendUrl}/settings`);
      setHalfTime(response.data.halfTime || 120);
      setBreakTime(response.data.breakTime || 30);
      setTimeLeft(response.data.halfTime || 120);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchRandomText = async () => {
    try {
      console.log("Fetching random text...");
      console.log(`${backendUrl}/texts/random`);
      const response = await axios.get(`${backendUrl}/texts/random`);
      setGivenText(response.data.content);
      mistakeTracker.current = new Array(response.data.content.length).fill(
        false
      );
    } catch (error) {
      console.error("Error fetching text:", error);
      setGivenText("Error loading text. Please refresh the page.");
    }
  };

  const handleUserSubmit = async (data) => {
    try {
      const response = await axios.post(`${backendUrl}/users`, data);
      setUserId(response.data._id);
      setUserData(data);
      setShowModal(false);
      setEnableEditor(true);
      // TODO: ui change on user submit -> show a card containing user details
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  };

  const startMetricsTracking = () => {
    if (metricsInterval) clearInterval(metricsInterval);

    let startTime = Date.now();
    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const currentHalf = isSecondHalf ? "secondHalf" : "firstHalf";

      setCurrentMetrics((prev) => ({
        ...prev,
        [currentHalf]: {
          ...prev[currentHalf],
          intervals: [
            ...prev[currentHalf].intervals,
            {
              timestamp: elapsedSeconds,
              charactersTyped: charactersTyped,
              mistakes: mistakes,
            },
          ],
          totalMistakes: mistakes,
          totalCharactersTyped: charactersTyped,
        },
      }));
    }, 10000); // every 10 seconds

    setMetricsInterval(interval);
  };

  const startTimer = () => {
    if (isActive) return;

    setIsActive(true);
    startMetricsTracking();

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setIsActive(true);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          if (isSecondHalf) {
            handleTestComplete();
          } else {
            handleHalfTimeEnd();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleHalfTimeEnd = () => {
    clearInterval(metricsInterval);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsActive(false);
    setIsBreak(true);
    setTimeLeft(breakTime);
    setFirstHalfStats({
      characterTyped: charactersTyped,
      mistakes: mistakes,
      timeSpent: halfTime,
    });

    // Start break timer in a separate interval
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          startSecondHalf();
          return halfTime;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startSecondHalf = () => {
    setIsBreak(false);
    setIsSecondHalf(true);
    setTimeLeft(halfTime);
    setUserInput("");
    setMistakes(0);
    setCharactersTyped(0);
    fetchRandomText();
  };

  const handleTestComplete = () => {
    clearInterval(metricsInterval);

    const saveMetrics = async () => {
      try {
        await axios.post(`${backendUrl}/metrics`, {
          userId,
          firstHalf: currentMetrics.firstHalf,
          secondHalf: currentMetrics.secondHalf,
          halfTime,
          breakTime,
        });
      } catch (error) {
        console.error("Error saving metrics:", error);
      }
    };

    saveMetrics();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsActive(false);

    const secondHalfStats = {
      characterTyped: charactersTyped,
      mistakes: mistakes,
      timeSpent: halfTime,
    };

    const totalStats = {
      name: userData.name,
      registrationNumber: userData.registrationNumber,
      department: userData.department,
      firstHalf: firstHalfStats,
      secondHalf: secondHalfStats,
      halfTime,
      breakTime,
    };

    saveTestData(totalStats);
    setUserInput("");
    setMistakes(0);
    setCharactersTyped(0);
    setTimeLeft(halfTime);
    setIsSecondHalf(false);
    setIsBreak(false);
    setFirstHalfStats(null);
    setSecondHalfStats(null);
    fetchRandomText();
  };

  useEffect(() => {
    return () => {
      if (metricsInterval) {
        clearInterval(metricsInterval);
      }
    };
  }, []);

  // const handleTimeSettingsChange = (type, value) => {
  //   const numValue = parseInt(value);
  //   if (type === 'half') {
  //     setHalfTime(numValue);
  //     if (!isActive && !isBreak) {
  //       setTimeLeft(numValue);
  //     }
  //   } else {
  //     setBreakTime(numValue);
  //   }
  // };

  const saveTestData = async (stats) => {
    if (!userData || !stats) return;

    const testData = {
      name: userData.name,
      registrationNumber: userData.registrationNumber,
      department: userData.department,
      timeIntervalStat: stats.firstHalf.timeSpent + stats.secondHalf.timeSpent,
      halfTime,
      breakTime,
      characterTyped:
        stats.firstHalf.characterTyped + stats.secondHalf.characterTyped,
      mistakes: stats.firstHalf.mistakes + stats.secondHalf.mistakes,
      firstHalf: stats.firstHalf,
      secondHalf: stats.secondHalf,
    };

    try {
      await axios.post(`${backendUrl}/tests`, testData);
      setTestHistory((prev) => [...prev, testData]);
    } catch (error) {
      console.error("Error saving test data:", error);
    }
  };

  const resetTest = () => {
    setUserInput("");
    setMistakes(0);
    setCharactersTyped(0);
    setTimeLeft(halfTime);
    setIsActive(false);
    setIsBreak(false);
    setIsSecondHalf(false);
    setFirstHalfStats(null);
    setSecondHalfStats(null);
    fetchRandomText();
  };

  const handleInputChange = (e) => {
    const input = e.target.value;

    if (!isActive && input.length > 0 && !isBreak) {
      startTimer();
    }

    setUserInput(input);
    setCharactersTyped(input.length);

    // Check for new mistakes
    input.split("").forEach((char, idx) => {
      if (char !== givenText[idx] && !mistakeTracker.current[idx]) {
        mistakeTracker.current[idx] = true;
        setMistakes((prev) => prev + 1);
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-row-reverse p-8 justify-around items-center mx-auto bg-gray-900 text-white">
      <div className="border-2 max-w-fit">
        {showModal ? (
          <UserModal isOpen={true} onSubmit={handleUserSubmit} />
        ) : (
          <div className="border-2 p-8">
            <div className="border-2 p-2">
              <UserDetailsCard />
            </div>
            user details card
          </div>
        )}
      </div>

      {enableEditor ? (
        <div className="max-w-2xl w-full p-8 border-2">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <p>Time Left: {timeLeft}s</p>
              <p>Mistakes: {mistakes}</p>
              <p>Characters Typed: {charactersTyped}</p>
            </div>
            <div className="flex flex-col gap-2">
              {/* <button
                onClick={() => setShowTimeSettings(!showTimeSettings)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                {showTimeSettings ? 'Hide Settings' : 'Change Time Settings'}
              </button> */}
              <button
                onClick={resetTest}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                End Test
              </button>
            </div>
          </div>

          {isBreak ? (
            <div className="text-center">
              <p className="mb-4">
                Break Time! Next half will start automatically in {timeLeft}{" "}
                seconds
              </p>
            </div>
          ) : (
            <>
              <div className="text-left font-mono text-xl mb-4">
                {givenText.split("").map((char, idx) => (
                  <span
                    key={idx}
                    className={
                      userInput[idx] === char
                        ? "text-green-500"
                        : userInput[idx]
                        ? "text-red-500"
                        : ""
                    }
                  >
                    {char}
                  </span>
                ))}
              </div>
              <textarea
                value={userInput}
                onChange={handleInputChange}
                className="w-full p-4 bg-gray-800 rounded"
                disabled={isBreak}
                autoFocus
                placeholder="Click here and type..."
              />
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center border-2 p-8 border-gray-600">
          <h1 className="font-bold text-2xl text-yellow-900 shadow-lg">
            Welcome to The Servey!
          </h1>
          <p className="text-sm pt-5 text-teal-400	">
            Please, enter your details first!
          </p>
        </div>
      )}
    </div>
  );
};

export default TypingTest;
