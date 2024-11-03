import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import UserModal from "./UserModal";
import UserDetailsCard from "./UserDetailsCard";

const backendUrl = process.env.REACT_APP_API_URL;

const TypingTest = () => {
  const [givenText, setGivenText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const [halfTime, setHalfTime] = useState(120); // 2mins default = 120s
  const [breakTime, setBreakTime] = useState(30); // 30s default
  const [timeLeft, setTimeLeft] = useState(120);
  const [isBreak, setIsBreak] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showModal, setShowModal] = useState(true);
  const [enableEditor, setEnableEditor] = useState(false);
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

  const metricsRef = useRef({
    charactersTyped: 0,
    mistakes: 0,
    intervals: {
      firstHalf: [],
      secondHalf: [],
    },
  });

  // Update refs when state changes
  useEffect(() => {
    metricsRef.current.charactersTyped = charactersTyped;
    metricsRef.current.mistakes = mistakes;

    // console.log("Metrics ref updated:", {
    //   charactersTyped,
    //   mistakes,
    //   timeLeft,
    // });
  }, [charactersTyped, mistakes, timeLeft]);

  const stats = []; // [{t: 20, m: 5}, {t: 40, m: 10}, {t: 60, m: 15}]

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
      // console.log("Settings response:", response.data);
      setHalfTime(response.data.halfTime || 120);
      setBreakTime(response.data.breakTime || 30);
      setTimeLeft(response.data.halfTime || 120);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchRandomText = async () => {
    try {
      const response = await axios.get(`${backendUrl}/texts/random`);
      // console.log("Text response:", response.data);
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
      // console.log(data);
      const response = await axios.post(`${backendUrl}/users`, data);
      setUserId(123456);
      setUserData(data);
      setShowModal(false);
      setEnableEditor(true);
      // console.log("user submit handled");
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  };

  const startMetricsTracking = () => {
    // console.log("Starting new metrics tracking session");

    if (metricsInterval) {
      // console.log("Clearing existing metrics intervals:", metricsInterval);
      clearInterval(metricsInterval);
    }

    

    // Reset the intervals for current half
    const currentHalf = isSecondHalf ? "secondHalf" : "firstHalf";
    metricsRef.current.intervals[currentHalf] = [];

    let startTime = Date.now();
    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      // const currentHalf = isSecondHalf ? "secondHalf" : "firstHalf";

      // Use the ref to get latest values
      const newInterval = {
        timestamp: elapsedSeconds,
        charactersTyped: metricsRef.current.charactersTyped,
        mistakes: metricsRef.current.mistakes,
      };

      console.log(`Metrics Update at ${elapsedSeconds}s:`, newInterval, currentHalf);
      //TODO: Save interval data to variable
      const newStat = {
        typed: newInterval.charactersTyped,
        mistakes: newInterval.mistakes,
      };
      // console.log("newStat", newStat);
      stats.push(newStat);
      // console.log("Stats:", stats);
      // Store interval data in ref
      metricsRef.current.intervals[currentHalf].push(newInterval);

      // Update the state with all accumulated data
      //added if for checking break edit 1
      if(!isBreak){
      setCurrentMetrics((prev) => {
        const newMetrics = {
          ...prev,
          [currentHalf]: {
            intervals: [...metricsRef.current.intervals[currentHalf]],
            totalMistakes: metricsRef.current.mistakes,
            totalCharactersTyped: metricsRef.current.charactersTyped,
          },
        };
        // console.log("Updated metrics state:", newMetrics);
        return newMetrics;
      });
    }
    }, 5000); // every 5 seconds

    setMetricsInterval(interval);
  };

  const startTimer = () => {
    if (isActive) return;

    setIsActive(true);
    startMetricsTracking();

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setIsActive(true); // Start the timer
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
    // console.log("First half completed. Storing first half stats:", {
    //   charactersTyped,
    //   mistakes,
    //   timeSpent: halfTime,
    // });

    clearInterval(metricsInterval);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setFirstHalfStats({
      characterTyped: charactersTyped,
      mistakes: mistakes,
      timeSpent: halfTime,
    });

    console.log("first half stats", firstHalfStats);

    // console.log("Starting break period");
    setIsActive(false);
    setIsBreak(true);
    setTimeLeft(breakTime); //checkpoint 1

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          console.log("Break time ended, starting second half");
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
    // console.log("Test completed. Preparing final metrics");
    clearInterval(metricsInterval);

    const secondHalfStats = {
      characterTyped: charactersTyped,
      mistakes: mistakes,
      timeSpent: halfTime,
    };

    // console.log("Second half stats:", secondHalfStats);
    // console.log("First half stats:", firstHalfStats);

    const totalStats = {
      name: userData.name,
      registrationNumber: userData.registrationNumber,
      department: userData.department,
      firstHalf: firstHalfStats,
      secondHalf: secondHalfStats,
      halfTime,
      breakTime,
    };

    // console.log("Preparing to save total stats:", totalStats);

    // Save metrics to backend
    const saveMetrics = async () => {
      try {
        console.log("Saving metrics to backend:", {
          userId,
          firstHalf: currentMetrics.firstHalf,
          secondHalf: currentMetrics.secondHalf,
        });

        // await axios.post(`${backendUrl}/metrics`, {
        //   userId,
        //   firstHalf: currentMetrics.firstHalf,
        //   secondHalf: currentMetrics.secondHalf,
        //   halfTime,
        //   breakTime,
        // });
        // console.log("Metrics saved successfully");
      } catch (error) {
        console.error("Error saving metrics:", error);
      }
    };

    // saveMetrics();
    console.log("final metrics", currentMetrics);
    saveTestData(totalStats);

    // console.log("Resetting test state");
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
    if (!userData || !stats) {
      // console.log("Missing userData or stats, cannot save test data");
      return;
    }

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

    // console.log("Saving complete test data:", testData);

    try {
      const response = await axios.post(`${backendUrl}/tests`, testData);
      // console.log("Test data saved successfully:", response.data);

      setTestHistory((prev) => {
        const updatedHistory = [...prev, testData];
        // console.log("Updated test history:", updatedHistory);
        return updatedHistory;
      });
    } catch (error) {
      console.error("Error saving test data:", error);
    }
  };

  const resetTest = () => {
    // TODO: send data to server before resetting
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
      <div className="max-w-fit">
        {showModal ? (
          <UserModal isOpen={true} onSubmit={handleUserSubmit} />
        ) : (
          <UserDetailsCard
            name={userData.name || "Anonymous"}
            reg={userData.registrationNumber}
            dept={userData.department}
          />
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
