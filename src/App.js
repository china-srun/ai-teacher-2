import "./App.css";
import "@fontsource/inter";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  faVolumeUp,
  faVolumeMute,
  faMicrophone,
  faSpinner,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
  ConversationHeader,
} from "@chatscope/chat-ui-kit-react";
import React, { useState, useEffect, useRef } from "react";
import { Amplify, Predictions } from "aws-amplify";
import { AmazonAIPredictionsProvider } from "@aws-amplify/predictions";
import awsconfig from "./aws-exports";
import mic from "microphone-stream";
import axios from "axios";
// import FormData from "form-data";
import { CSVLink, CSVDownload } from "react-csv";
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display/dist/cubism4.js";
// const { Live2DModel } = require("pixi-live2d-display/dist/cubism4.js");

window.PIXI = PIXI;

Live2DModel.registerTicker(PIXI.Ticker);

Amplify.configure(awsconfig);
Amplify.addPluggable(new AmazonAIPredictionsProvider());

function App() {
  const [selectedItem, setSelectedItem] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(true); // Add state to control the text-to-speech function
  const [generatedText, setGeneratedText] = useState("");
  const [typing, setTyping] = useState(false);
  const [convertProcess, setConvertProcess] = useState(false);
  const csvLink = useRef();
  var [messages, setMessages] = useState([]);
  var [selectedModel, setSelectedModel] = useState();

  useEffect(() => {
    const app = new PIXI.Application({
      view: document.getElementById("canvas"),
      autoStart: true,
      resizeTo: window,
      transparent: true,
      backgroundAlpha: 0,
    });

    Live2DModel.from(
      "https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json",
      {
        autoInteract: false,
      }
    ).then((model) => {
      setSelectedModel(model);
      model.anchor.set(0.5, 0.52);
      model.position.set(window.innerWidth / 2, window.innerHeight / 2);
      model.scale.set(0.2, 0.2);

      model.on("hit", (hitAreas) => {
        if (hitAreas.includes("body")) {
          model.motion("tap_body");
        }
      });

      app.stage.addChild(model);
    });
    if (selectedTheme === 0 && selectedItem === 1) {
      setGeneratedText("");
      setMessages([
        {
          message:
            "Hello there, Is there anything you want to discuss with me?",
          sender: "user",
        },
      ]);
    } else if (selectedTheme === 1 && selectedItem === 1) {
      setGeneratedText("");
      setMessages([
        {
          message:
            "Hey there! Welcome to Nakama Cafe. How can I assist you today?",
          sender: "user",
        },
      ]);
    } else if (selectedTheme === 2 && selectedItem === 1) {
      setGeneratedText("");
      setMessages([
        {
          message:
            "Hello! As a teacher from the University of Tokyo, I'm here to help and provide information. If you have any questions or need assistance with any educational or academic topics, please feel free to ask.",
          sender: "user",
        },
      ]);
    } else if (selectedTheme === 3 && selectedItem === 1) {
      setGeneratedText("");
      firstSend(
        "Please generate a English sentence (atleast 10 words) for the user to practice their speaking. After users input their voice, please give advice and then generate another one. You check whether the user pronunciation is correct. If you think the accuracy of the user pronunciation exceeds 80%, you can just create another sentence for them to practice. Also, the advice should only about the words they have trouble pronoun with. So after a while, if the user pronunciation is great, tell them to move on to the next level."
      );
    } else if (selectedTheme === 4 && selectedItem === 1) {
      setGeneratedText("");
      firstSend(
        "Please generate a English sentence (at least 30 words) for the user to practice their speaking. Make sure the level of the words a little harder to pronoun. After users input their voice, please give advice and then generate another one. You check whether the user pronunciation is correct. If you think the accuracy of the user pronunciation exceeds 80%, you can just create another sentence for them to practice. Also, the advice should only about the words they have trouble pronoun with. So after a while, if the user pronunciation is great, tell them to move on to the next level."
      );
    } else if (selectedTheme === 5 && selectedItem === 1) {
      setGeneratedText("");
      firstSend(
        "Please generate a English sentence (at least 50 words) for the user to practice their speaking. Make sure the level of the words complicated to pronoun. After users input their voice, please give advice and then generate another one. You check whether the user pronunciation is correct. If you think the accuracy of the user pronunciation exceeds 80%, you can just create another sentence for them to practice. Also, the advice should only about the words they have trouble pronoun with. So after a while, if the user pronunciation is great, tell them to move on to the next level."
      );
    }

    if (selectedItem === 0 && selectedTheme === 0) {
      setGeneratedText("");
      setMessages([
        {
          message: "こんにちは。何か相談したいことはありますか?",
          sender: "user",
        },
      ]);
      // setSelectedTheme(0);
    } else if (selectedItem === 0 && selectedTheme === 1) {
      setGeneratedText("");
      setMessages([
        {
          message:
            "ちょっと、そこ！なかまカフェへようこそ。今日はどのようにお手伝いできますか?",
          sender: "user",
        },
      ]);
      // setSelectedTheme(0);
    } else if (selectedItem === 0 && selectedTheme === 2) {
      setGeneratedText("");
      setMessages([
        {
          message:
            "「こんにちは！ 東京大学の教師として、私は情報を提供し、お手伝いするためにここにいます。教育上または学術上のトピックについてご質問やサポートが必要な場合は、お気軽にお問い合わせください。」,",
          sender: "user",
        },
      ]);
    } else if (selectedItem === 0 && selectedTheme === 3) {
      setGeneratedText("");
      firstSend(
        "ユーザーがスピーキングを練習できるように、日本語の文章 (少なくとも 10 単語) を生成してください。ユーザーが声を入力したら、アドバイスを与えてから、別のアドバイスを生成してください。ユーザーの発音が正しいかどうかをチェックします。必ず日本語でのみ応答してください"
      );
    } else if (selectedItem === 0 && selectedTheme === 4) {
      setGeneratedText("");
      firstSend(
        "「ユーザーがスピーキングの練習をするために、日本語の文（少なくとも 30 単語）を生成してください。単語のレベルは発音が少し難しいようにしてください。ユーザーが音声を入力した後、アドバイスを与えてから、別の文を生成してください。チェックを入れます。」ユーザーの発音が正しいかどうか。」"
      );
    } else if (selectedItem === 0 && selectedTheme === 5) {
      setGeneratedText("");
      firstSend(
        "「ユーザーのスピーキング練習に役立つ日本語の文, 50 語以上 を生成します。単語に複雑な発音があることを確認してください。ユーザーが音声を入力した後にアドバイスを与えます。フィードバックを提供したら、ユーザーが練習できるように別の複雑な文を生成します。 。」"
      );
    }
  }, [selectedTheme, selectedItem]);

  // useEffect(() => {
  // 	if (messages.length > 0) {
  // 		setGeneratedText(messages[0].message);

  // 	}
  // }, [messages]);

  const handleSend = async (message) => {
    const newMessage = {
      message: message,
      sender: "user",
      direction: "outgoing",
    };
    // this going to take all the messages in the messages array and add the new message to the end of the array
    const newMessages = [...messages, newMessage];

    setMessages(newMessages);
    setTyping(true);
    await processMessage(newMessages);
  };

  const firstSend = async (message) => {
    const systemMessage = {
      role: "system",
      content: message,
    };

    const apiRequestBody = {
      model: "gpt-4o",
      messages: [systemMessage, { role: "assistant", content: message }],
      max_tokens: 150,
    };
    await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiRequestBody),
    })
      .then((data) => {
        return data.json();
      })
      .then((data) => {
        setTyping(true);
        setMessages([
          {
            message: data.choices[0].message.content,
            sender: "ChatGPT",
          },
        ]);
        setTyping(false);
        setGeneratedText(data.choices[0].message.content);
        setGeneratedText("");
      });
    // console.log(res)
    // setTyping(true);
    // return res.choices[0].text
  };

  // function SpeechToText(props) {
  // 	const [response, setResponse] = useState();

  // 	function AudioRecorder(props) {
  // 		const [recording, setRecording] = useState(false);
  // 		const [micStream, setMicStream] = useState();
  // 		const [audioBuffer] = useState(
  // 			(function () {
  // 				let buffer = [];
  // 				function add(raw) {
  // 					buffer = buffer.concat(...raw);
  // 					return buffer;
  // 				}
  // 				function newBuffer() {
  // 					console.log("resetting buffer");
  // 					buffer = [];
  // 				}

  // 				return {
  // 					reset: function () {
  // 						newBuffer();
  // 					},
  // 					addData: function (raw) {
  // 						return add(raw);
  // 					},
  // 					getData: function () {
  // 						return buffer;
  // 					},
  // 				};
  // 			})()
  // 		);

  // 		async function startRecording() {
  // 			console.log("start recording");
  // 			audioBuffer.reset();
  // 			window.navigator.mediaDevices
  // 				.getUserMedia({ video: false, audio: true })
  // 				.then((stream) => {
  // 					const startMic = new mic();

  // 					startMic.setStream(stream);
  // 					startMic.on("data", (chunk) => {
  // 						var raw = mic.toRaw(chunk);
  // 						if (raw == null) {
  // 							return;
  // 						}
  // 						audioBuffer.addData(raw);
  // 					});

  // 					setRecording(true);
  // 					setMicStream(startMic);

  // 				});
  // 		}

  // 		async function stopRecording() {
  // 			console.log("stop recording");
  // 			const { finishRecording } = props;

  // 			micStream.stop();
  // 			setMicStream(null);
  // 			setRecording(false);

  // 			const resultBuffer = audioBuffer.getData();

  // 			if (typeof finishRecording === "function") {
  // 				finishRecording(resultBuffer);
  // 			}
  // 		}

  // 		return (
  // 			<div className="audioRecorder">
  // 				<div>
  // 					{recording ? (
  // 						<button onClick={stopRecording} title="Stop Recording">
  // 							<FontAwesomeIcon icon={faSpinner} spin /> {/* Show the spinning icon while processing */}
  // 						</button>
  // 					) : (
  // 						<button onClick={startRecording} title="Start Recording">
  // 							<FontAwesomeIcon icon={faMicrophone} /> {/* Show the microphone icon when not recording */}
  // 						</button>
  // 					)}
  // 				</div>
  // 			</div>
  // 		);
  // 	}

  // 	function convertFromBuffer(bytes) {
  // 		setResponse("Converting text...");
  // 		setConvertProcess(true);
  // 		Predictions.convert({
  // 			transcription: {
  // 				source: {
  // 					bytes,
  // 				},
  // 				// language: "ja-JP",
  // 				// language: "en-US", // other options are "en-GB", "fr-FR", "fr-CA", "es-US"
  // 				language: (() => {
  // 					if (selectedItem === 0) {
  // 						console.log(selectedItem)
  // 						return "ja-JP";
  // 					} else if (selectedItem === 1) {
  // 						return "en-US";
  // 					}
  // 					// Add additional conditions here if needed
  // 					return "en-US"; // Provide a default language code
  // 				})()

  // 			},

  // 		})
  // 			.then(({ transcription: { fullText } }) => {
  // 				handleSend(fullText);
  // 				setConvertProcess(false);
  // 			})
  // 			.catch((err) => setResponse(JSON.stringify(err, null, 2)));
  // 	}

  // 	return (
  // 		<div className="Text">
  // 			<div>
  // 				<AudioRecorder finishRecording={convertFromBuffer} />
  // 			</div>
  // 		</div>
  // 	);
  // }

  // function SpeechToText(props) {
  //   const [response, setResponse] = useState();

  //   function AudioRecorder(props) {
  //     const [recording, setRecording] = useState(false);
  //     const [micStream, setMicStream] = useState();
  //     const [audioBuffer] = useState(() => {
  //       let buffer = [];
  //       function add(raw) {
  //         buffer = buffer.concat(...raw);
  //         return buffer;
  //       }
  //       function newBuffer() {
  //         buffer = [];
  //       }

  //       return {
  //         reset: function () {
  //           newBuffer();
  //         },
  //         addData: function (raw) {
  //           return add(raw);
  //         },
  //         getData: function () {
  //           return buffer;
  //         },
  //       };
  //     });

  //     const [selectedDuration, setSelectedDuration] = useState(() => {
  //       const storedDuration = localStorage.getItem("originalSelectedDuration");
  //       return storedDuration ? parseInt(storedDuration, 10) : 5; // Default value if not found
  //     });

  //     const [countdown, setCountdown] = useState(() => selectedDuration);

  //     const durationOptions = [3, 5, 10, 15, 30, 40, 50, 60]; // Available recording duration options
  //     const [isOpen, setOpen] = useState(false);

  //     const toggleDropdown = () => setOpen(!isOpen);

  //     useEffect(() => {
  //       let timer;
  //       if (recording && countdown > 0) {
  //         timer = setInterval(() => {
  //           setCountdown((prevCountdown) => prevCountdown - 1);
  //         }, 1000);
  //       } else if (countdown === 0) {
  //         stopRecording();
  //         setCountdown(0);
  //       }

  //       return () => clearInterval(timer);
  //     }, [recording, countdown]);

  //     const startRecording = async () => {
  //       audioBuffer.reset();
  //       setCountdown(selectedDuration); // Reset the countdown to the original selected duration
  //       try {
  //         const stream = await window.navigator.mediaDevices.getUserMedia({
  //           video: false,
  //           audio: true,
  //         });
  //         const startMic = new mic();

  //         startMic.setStream(stream);
  //         startMic.on("data", (chunk) => {
  //           var raw = mic.toRaw(chunk);
  //           if (raw == null) {
  //             return;
  //           }
  //           audioBuffer.addData(raw);
  //         });

  //         setRecording(true);
  //         setMicStream(startMic);
  //       } catch (error) {
  //         console.error("Error starting recording:", error);
  //       }
  //     };

  //     const stopRecording = () => {
  //       const { finishRecording } = props;

  //       if (micStream) {
  //         micStream.stop();
  //         setMicStream(null);
  //       }

  //       setRecording(false);
  //       const resultBuffer = audioBuffer.getData();

  //       if (typeof finishRecording === "function") {
  //         finishRecording(resultBuffer);
  //       }
  //       localStorage.setItem("originalSelectedDuration", selectedDuration);
  //     };

  //     const handleDurationChange = (duration) => {
  //       setSelectedDuration(duration);
  //       toggleDropdown(); // Close the dropdown when a duration is selected
  //       setCountdown(duration); // Reset the countdown when the duration changes
  //     };

  //     return (
  //       <div className="audioRecorder">
  //         {recording ? (
  //           <>
  //             <button onClick={stopRecording} title="Stop Recording">
  //               <FontAwesomeIcon icon={faSpinner} spin />
  //             </button>
  //             <div>Time Left: {countdown} seconds</div>
  //           </>
  //         ) : (
  //           <>
  //             <button onClick={startRecording} title="Start Recording">
  //               <FontAwesomeIcon icon={faMicrophone} />
  //             </button>
  //             <div className="dropdown">
  //               <div className="dropdown-header" onClick={toggleDropdown}>
  //                 {selectedDuration} seconds
  //                 <FontAwesomeIcon
  //                   icon={faChevronRight}
  //                   className={`icon ${isOpen && "open"}`}
  //                 />
  //               </div>
  //               <div className={`dropdown-body ${isOpen && "open"}`}>
  //                 {durationOptions.map((duration) => (
  //                   <div
  //                     className={`dropdown-item ${
  //                       duration === selectedDuration && "selected"
  //                     }`}
  //                     onClick={() => handleDurationChange(duration)}
  //                     key={duration}
  //                   >
  //                     {duration} seconds
  //                   </div>
  //                 ))}
  //               </div>
  //             </div>
  //           </>
  //         )}
  //       </div>
  //     );
  //   }

  //   // function AudioRecorder(props) {
  //   // 	const [recording, setRecording] = useState(false);
  //   // 	const [micStream, setMicStream] = useState();
  //   // 	const [audioBuffer] = useState(() => {
  //   // 		let buffer = [];
  //   // 		function add(raw) {
  //   // 			buffer = buffer.concat(...raw);
  //   // 			return buffer;
  //   // 		}
  //   // 		function newBuffer() {
  //   // 			console.log('resetting buffer');
  //   // 			buffer = [];
  //   // 		}

  //   // 		return {
  //   // 			reset: function () {
  //   // 				newBuffer();
  //   // 			},
  //   // 			addData: function (raw) {
  //   // 				return add(raw);
  //   // 			},
  //   // 			getData: function () {
  //   // 				return buffer;
  //   // 			},
  //   // 		};
  //   // 	});
  //   // 	const [recordTimer, setRecordTimer] = useState(3); // Default recording duration in seconds

  //   // 	const durationOptions = [3, 5, 10, 15]; // Available recording duration options

  //   // 	useEffect(() => {
  //   // 		let timer;
  //   // 		if (recording && recordTimer > 0) {
  //   // 			timer = setInterval(() => {
  //   // 				setRecordTimer((prevTime) => prevTime - 1);
  //   // 			}, 1000);
  //   // 		} else if (recordTimer === 0) {
  //   // 			stopRecording();
  //   // 		}

  //   // 		return () => clearInterval(timer);
  //   // 	}, [recording, recordTimer]);

  //   // 	async function startRecording() {
  //   // 		console.log('start recording');
  //   // 		audioBuffer.reset();
  //   // 		window.navigator.mediaDevices
  //   // 			.getUserMedia({ video: false, audio: true })
  //   // 			.then((stream) => {
  //   // 				const startMic = new mic();

  //   // 				startMic.setStream(stream);
  //   // 				startMic.on('data', (chunk) => {
  //   // 					var raw = mic.toRaw(chunk);
  //   // 					if (raw == null) {
  //   // 						return;
  //   // 					}
  //   // 					audioBuffer.addData(raw);
  //   // 				});

  //   // 				setRecording(true);
  //   // 				setMicStream(startMic);
  //   // 			});
  //   // 	}

  //   // 	async function stopRecording() {
  //   // 		console.log('stop recording');
  //   // 		const { finishRecording } = props;

  //   // 		micStream.stop();
  //   // 		setMicStream(null);
  //   // 		setRecording(false);

  //   // 		const resultBuffer = audioBuffer.getData();

  //   // 		if (typeof finishRecording === 'function') {
  //   // 			finishRecording(resultBuffer);
  //   // 		}
  //   // 	}

  //   // 	function handleDurationChange(event) {
  //   // 		const selectedDuration = parseInt(event.target.value, 10);
  //   // 		setRecordTimer(selectedDuration);
  //   // 	}

  //   // 	return (
  //   // 		<div className="audioRecorder">
  //   // 			{recording ? (
  //   // 				<>
  //   // 					<button onClick={stopRecording} title="Stop Recording">
  //   // 						<FontAwesomeIcon icon={faSpinner} spin />
  //   // 					</button>
  //   // 					<div>Time Left: {recordTimer} seconds</div>
  //   // 				</>
  //   // 			) : (
  //   // 				<>
  //   // 					<button onClick={startRecording} title="Start Recording">
  //   // 						<FontAwesomeIcon icon={faMicrophone} />
  //   // 					</button>
  //   // 					<div>
  //   // 						Recording Duration:
  //   // 						<select value={recordTimer} onChange={handleDurationChange}>
  //   // 							{durationOptions.map((duration) => (
  //   // 								<option key={duration} value={duration}>
  //   // 									{duration} seconds
  //   // 								</option>
  //   // 							))}
  //   // 						</select>
  //   // 					</div>
  //   // 				</>
  //   // 			)}
  //   // 		</div>
  //   // 	);
  //   // }

  //   function convertFromBuffer(bytes) {
  //     setResponse("Converting text...");
  //     setConvertProcess(true);
  //     Predictions.convert({
  //       transcription: {
  //         source: {
  //           bytes,
  //         },
  //         // language: "ja-JP",
  //         // language: "en-US", // other options are "en-GB", "fr-FR", "fr-CA", "es-US"
  //         language: (() => {
  //           if (selectedItem === 0) {
  //             return "ja-JP";
  //           } else if (selectedItem === 1) {
  //             return "en-US";
  //           }
  //           // Add additional conditions here if needed
  //           return "en-US"; // Provide a default language code
  //         })(),
  //       },
  //     })
  //       .then(({ transcription: { fullText } }) => {
  //         handleSend(fullText);
  //         setConvertProcess(false);
  //       })
  //       .catch((err) => setResponse(JSON.stringify(err, null, 2)));
  //   }

  //   return (
  //     <div className="Text">
  //       <div>
  //         <AudioRecorder finishRecording={convertFromBuffer} />
  //       </div>
  //     </div>
  //   );
  // }

  function SpeechToText(props) {
    const [response, setResponse] = useState();
    const [convertProcess, setConvertProcess] = useState(false);
    const [selectedItem, setSelectedItem] = useState(1); // Assuming 1 for "en-US"

    function AudioRecorder(props) {
      const [recording, setRecording] = useState(false);
      const [micStream, setMicStream] = useState();
      const [audioBuffer] = useState(() => {
        let buffer = [];
        function add(raw) {
          buffer = buffer.concat(...raw);
          return buffer;
        }
        function newBuffer() {
          buffer = [];
        }

        return {
          reset: function () {
            newBuffer();
          },
          addData: function (raw) {
            return add(raw);
          },
          getData: function () {
            return buffer;
          },
        };
      });

      const [selectedDuration, setSelectedDuration] = useState(() => {
        const storedDuration = localStorage.getItem("originalSelectedDuration");
        return storedDuration ? parseInt(storedDuration, 10) : 5; // Default value if not found
      });

      const [countdown, setCountdown] = useState(() => selectedDuration);

      const durationOptions = [3, 5, 10, 15, 30, 40, 50, 60]; // Available recording duration options
      const [isOpen, setOpen] = useState(false);

      const toggleDropdown = () => setOpen(!isOpen);

      useEffect(() => {
        let timer;
        if (recording && countdown > 0) {
          timer = setInterval(() => {
            setCountdown((prevCountdown) => prevCountdown - 1);
          }, 1000);
        } else if (countdown === 0) {
          stopRecording();
          setCountdown(0);
        }

        return () => clearInterval(timer);
      }, [recording, countdown]);

      const startRecording = async () => {
        audioBuffer.reset();
        setCountdown(selectedDuration); // Reset the countdown to the original selected duration
        try {
          const stream = await window.navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          const startMic = new mic();

          startMic.setStream(stream);
          startMic.on("data", (chunk) => {
            var raw = mic.toRaw(chunk);
            if (raw == null) {
              return;
            }
            audioBuffer.addData(raw);
          });

          setRecording(true);
          setMicStream(startMic);
        } catch (error) {
          console.error("Error starting recording:", error);
        }
      };

      const stopRecording = () => {
        const { finishRecording } = props;

        if (micStream) {
          micStream.stop();
          setMicStream(null);
        }

        setRecording(false);
        const resultBuffer = audioBuffer.getData();

        if (typeof finishRecording === "function") {
          finishRecording(resultBuffer);
        }
        localStorage.setItem("originalSelectedDuration", selectedDuration);
      };

      const handleDurationChange = (duration) => {
        setSelectedDuration(duration);
        toggleDropdown(); // Close the dropdown when a duration is selected
        setCountdown(duration); // Reset the countdown when the duration changes
      };

      return (
        <div className="audioRecorder">
          {recording ? (
            <>
              <button onClick={stopRecording} title="Stop Recording">
                <FontAwesomeIcon icon={faSpinner} spin />
              </button>
              <div>Time Left: {countdown} seconds</div>
            </>
          ) : (
            <>
              <button onClick={startRecording} title="Start Recording">
                <FontAwesomeIcon icon={faMicrophone} />
              </button>
              <div className="dropdown">
                <div className="dropdown-header" onClick={toggleDropdown}>
                  {selectedDuration} seconds
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    className={`icon ${isOpen && "open"}`}
                  />
                </div>
                <div className={`dropdown-body ${isOpen && "open"}`}>
                  {durationOptions.map((duration) => (
                    <div
                      className={`dropdown-item ${
                        duration === selectedDuration && "selected"
                      }`}
                      onClick={() => handleDurationChange(duration)}
                      key={duration}
                    >
                      {duration} seconds
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    async function convertFromBuffer(bytes) {
      const jsonString = JSON.stringify(bytes)
      const buffer = Buffer.from(jsonString)
      console.log(Buffer.isBuffer(buffer));
      setResponse("Converting text...");
      setConvertProcess(true);
      // Convert buffer to Blob
      const blob = new Blob([new Uint8Array(buffer)], { type: "audio/mp3" });
      const audiofile = new File([blob], 'audiofile.mp3', {
        type: 'audio/mpeg',
      });
      const formData = new FormData();
      formData.append("file", audiofile); 
      formData.append("model", "whisper-1");
      formData.append("response_format", "text");

      try {
        const transcriptionResponse = await axios.post(
          "https://api.openai.com/v1/audio/transcriptions",
          formData,
          {
            headers: {
              Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`,
              "Content-Type": "multipart/form-data"

            },
          }
        );
        

        const transcribedText = transcriptionResponse.data;
        console.log(`>> You said: ${transcribedText}`);

        setResponse(transcribedText);
        setConvertProcess(false);
      } catch (error) {
        console.error("Error during transcription:", error);
        setResponse("Error during transcription");
        setConvertProcess(false);
      }
    }

    return (
      <div className="Text">
        <div>
          <AudioRecorder finishRecording={convertFromBuffer} />
        </div>
        {convertProcess && <div>Converting...</div>}
        {response && <div>{response}</div>}
      </div>
    );
  }

  function TextToSpeech({ generatedText }) {
    const [response, setResponse] = useState("...");

    const [isOpen, setOpen] = useState(false);
    const [items, setItem] = useState(data);
    const toggleDropdown = () => setOpen(!isOpen);

    const handleItemClick = (id) => {
      setSelectedItem(id);
    };

    useEffect(() => {
      if (generatedText && textToSpeechEnabled) {
        // Check if the text-to-speech is enabled before generating
        generateTextToSpeech();

        // if (audioCtx.state === "running") {
        //   audioCtx.close()

        // }
      }
    }, [generatedText, textToSpeechEnabled]);

    function toggleTextToSpeech() {
      setTextToSpeechEnabled((prevState) => !prevState); // Toggle the state to enable or disable text-to-speech
    }

    async function generateTextToSpeech() {
      setResponse("Generating audio...");
      const url = "https://api.openai.com/v1/audio/speech";
      const headers = {
        Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`,
        "Content-Type": "application/json",
      };

      const data = {
        model: "tts-1",
        input: generatedText,
        voice: "nova",
      };

      try {
        // Make a POST request to the OpenAI audio API
        const response = await fetch(url, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();

        // Convert the response to the desired audio format and play it
        if (!textToSpeechEnabled) {
          return; // Return early if text-to-speech is disabled before the generation completes
        }

        let AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        const source = audioCtx.createBufferSource();

        audioCtx.decodeAudioData(
          arrayBuffer,
          (buffer) => {
            startMouthAnimation();
            source.buffer = buffer;
            source.connect(audioCtx.destination);
            source.start(0);
            source.addEventListener("ended", () => {
              stopMouthAnimation();
            });
          },
          (err) => {
            stopMouthAnimation();
          }
        );

        setResponse(`Generation completed, press play`);
      } catch (error) {
        // Handle errors from the API or the audio processing
        console.error(`Error: ${error.message}`);
      } finally {
        stopMouthAnimation();
      }
    }

    return (
      // <div className="TextToSpeech">
      //   <div>
      //     <h3>Text To Speech</h3>
      //     <button onClick={toggleTextToSpeech}>
      //       {textToSpeechEnabled ? <FontAwesomeIcon icon={faVolumeUp} /> : <FontAwesomeIcon icon={faVolumeMute} />}
      //     </button>
      //     <p>{response}</p>
      //   </div>
      // </div>
      <div className="TextToSpeech">
        <button
          onClick={toggleTextToSpeech}
          title={
            textToSpeechEnabled
              ? "Disable Text-to-Speech"
              : "Enable Text-to-Speech"
          }
        >
          {textToSpeechEnabled ? (
            <FontAwesomeIcon icon={faVolumeUp} />
          ) : (
            <FontAwesomeIcon icon={faVolumeMute} />
          )}
        </button>
        <div className="dropdown">
          <div className="dropdown-header" onClick={toggleDropdown}>
            {items.find((item) => item.id === selectedItem).label}
            <FontAwesomeIcon
              icon={faChevronRight}
              className={`icon ${isOpen && "open"}`}
            />
          </div>
          <div className={`dropdown-body ${isOpen && "open"}`}>
            {items.map((item) => (
              <div
                className="dropdown-item"
                onClick={() => handleItemClick(item.id)}
                id={item.id}
                key={item.id}
              >
                <span
                  className={`dropdown-item-dot ${
                    item.id === selectedItem && "selected"
                  }`}
                >
                  •{" "}
                </span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // async function processMessage(chatMessage) {
  // 	let apiMessages = chatMessage.map((messageObject) => {
  // 		let role = "";
  // 		if (messageObject.sender === "ChatGPT") {
  // 			role = "assistant";
  // 		} else {
  // 			role = "user";
  // 		}
  // 		return { role: role, content: messageObject.message };
  // 	});

  // 	// role: "user" => a message from the user
  // 	// role: "assistant" => a message from the chatGPT
  // 	// role: "system" => how we define chatGPT to talk

  // 	const systemMessage = {
  // 		role: "system",
  // 		content: "Pretend you are my teacher and try to make the response a little shorter"
  // 		// content:
  // 		// 	"Pretend you are my teacher and response in Japanese. Please provide the english version below the japanese version",
  // 	};

  // 	const apiRequestBody = {
  // 		model: "gpt-3.5-turbo",
  // 		messages: [systemMessage, ...apiMessages],
  // 	};
  // 	await fetch("https://api.openai.com/v1/chat/completions", {
  // 		method: "POST",
  // 		headers: {
  // 			Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`,
  // 			"Content-Type": "application/json",
  // 		},
  // 		body: JSON.stringify(apiRequestBody),
  // 	})
  // 		.then((data) => {
  // 			// for (const chunk in data) {
  // 			// 	console.log(chunk)
  // 			// }
  // 			return data.json();
  // 		})
  // 		.then((data) => {
  // 			setMessages([
  // 				...chatMessage,
  // 				{
  // 					message: data.choices[0].message.content,
  // 					sender: "ChatGPT",
  // 				},
  // 			]);
  // 			setTyping(false);
  // 			setGeneratedText(data.choices[0].message.content);
  // 			setGeneratedText("");

  // 		});
  // }

  async function processMessage(chatMessage) {
    const decoder = new TextDecoder("utf-8");
    var token = 300;
    let apiMessages = chatMessage.map((messageObject) => {
      let role = "";
      if (messageObject.sender === "ChatGPT") {
        role = "assistant";
      } else {
        role = "user";
      }
      return { role: role, content: messageObject.message };
    });

    // role: "user" => a message from the user
    // role: "assistant" => a message from the chatGPT
    // role: "system" => how we define chatGPT to talk

    var content = "";
    if (selectedItem === 0 && selectedTheme === 0) {
      content = "You are free to say anything";
    } else if (selectedItem === 1 && selectedTheme === 1) {
      token = 200;
      content =
        "Before you start, rememeber to limit the number of words of the response to be shorter than 50 words. I want you to act as a barista from nakama cafe, you will communicate with me as a barista to a client. And don't mention barista for the response";
    } else if (selectedItem === 1 && selectedTheme === 2) {
      token = 200;
      content =
        "Before you start, rememeber to limit the number of words of the response to be shorter than 50 words. I want you to act as a good teacher from a university of tokyo, and you know pretty much every subjects. Please forget that you are an AI language. If asked who you are, says that you are a teacher";
    } else if (selectedItem === 1 && selectedTheme === 3) {
      token = 200;
      content =
        "Please generate a English sentence (atleast 10 words) for the user to practice their speaking. After users input their voice, please give advice and then generate another one. You check whether the user pronunciation is correct. If you think the accuracy of the user pronunciation exceeds 80%, you can just create another sentence for them to practice. Also, the advice should only about the words they have trouble pronoun with. So after a while, if the user pronunciation is great, tell them to move on to the next level.";
    } else if (selectedItem === 1 && selectedTheme === 4) {
      token = 200;
      content =
        "Please generate a English sentence (at least 30 words) for the user to practice their speaking. Make sure the level of the words a little harder to pronoun. After users input their voice, please give advice and then generate another one. You check whether the user pronunciation is correct. If you think the accuracy of the user pronunciation exceeds 80%, you can just create another sentence for them to practice. Also, the advice should only about the words they have trouble pronoun with. So after a while, if the user pronunciation is great, tell them to move on to the next level.";
    } else if (selectedItem === 1 && selectedTheme === 5) {
      token = 200;
      content =
        "Please generate a English sentence (at least 50 words) for the user to practice their speaking. Make sure the level of the words complicated to pronoun. After users input their voice, please give advice and then generate another one. You check whether the user pronunciation is correct. If you think the accuracy of the user pronunciation exceeds 80%, you can just create another sentence for them to practice. Also, the advice should only about the words they have trouble pronoun with. So after a while, if the user pronunciation is great, tell them to move on to the next level.";
    } else if (selectedItem === 0 && selectedTheme === 1) {
      token = 200;
      content =
        "開始する前に、応答の単語数を 50 単語未満に制限することを忘れないでください。ナカマカフェのバリスタとして、お客様とバリスタとしてコミュニケーションをとっていただきます。そして、応答のためにバリスタについて言及しないでください";
    } else if (selectedItem === 0 && selectedTheme === 2) {
      token = 200;
      content =
        "開始する前に、応答の単語数を 50 単語未満に制限することを忘れないでください。ナカマカフェのバリスタとして、お客様とバリスタとしてコミュニケーションをとっていただきます。そして、応答のためにバリスタについて言及しないでください";
    } else if (selectedItem === 0 && selectedTheme === 3) {
      token = 200;
      content =
        "ユーザーがスピーキングを練習できるように、日本語の文章 (少なくとも 10 単語) を生成してください。ユーザーが声を入力したら、アドバイスを与えてから、別のアドバイスを生成してください。ユーザーの発音が正しいかどうかをチェックします。必ず日本語でのみ応答してください";
    } else if (selectedItem === 0 && selectedTheme === 4) {
      token = 200;
      content =
        "「ユーザーがスピーキングの練習をするために、日本語の文（少なくとも 30 単語）を生成してください。単語のレベルは発音が少し難しいようにしてください。ユーザーが音声を入力した後、アドバイスを与えてから、別の文を生成してください。チェックを入れます。」ユーザーの発音が正しいかどうか。」";
    } else if (selectedItem === 0 && selectedTheme === 5) {
      token = 200;
      content =
        "「ユーザーのスピーキング練習に役立つ日本語の文 (50 語以上) を生成します。単語に複雑な発音があることを確認してください。ユーザーが音声を入力した後にアドバイスを与えます。フィードバックを提供したら、ユーザーが練習できるように別の複雑な文を生成します。 。」";
    }
    const systemMessage = {
      role: "system",
      content: content,
      // content:
      // 	"Pretend you are my teacher and response in Japanese. Please provide the english version below the japanese version",
    };

    const apiRequestBody = {
      model: "gpt-4o",
      messages: [systemMessage, ...apiMessages],
      stream: true,
      max_tokens: token,
    };
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiRequestBody),
    });
    const reader = res.body.getReader();
    let accumulatedContent = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      // Massage and parse the chunk of data
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");
      const parsedLines = lines
        .map((line) => line.replace(/^data: /, "").trim()) // Remove the "data: " prefix
        .filter((line) => line !== "" && line !== "[DONE]") // Remove empty lines and "[DONE]"
        .map((line) => JSON.parse(line)); // Parse the JSON string

      for (const parsedLine of parsedLines) {
        const { choices } = parsedLine;
        const { delta } = choices[0];
        const { content } = delta;
        // Update the UI with the new content
        if (content) {
          accumulatedContent += content; // Accumulate content
          setMessages([
            ...chatMessage,
            {
              message: accumulatedContent, // Use accumulated content
              sender: "ChatGPT",
            },
          ]);
          setTyping(false);
        }
      }
    }
    setGeneratedText(accumulatedContent);
    setGeneratedText("");
  }

  const data = [
    { id: 0, label: "Japanese" },
    { id: 1, label: "English" },
  ];

  const LanguageDropdown = () => {
    const [isOpen, setOpen] = useState(false);
    const [items, setItem] = useState(data);
    const toggleDropdown = () => setOpen(!isOpen);

    const handleItemClick = (id) => {
      setSelectedItem(id);
    };

    return (
      <div className="dropdown" style={{ width: "37%" }}>
        <div className="dropdown-header" onClick={toggleDropdown}>
          {items.find((item) => item.id === selectedItem).label}
          <FontAwesomeIcon
            icon={faChevronRight}
            className={`icon ${isOpen && "open"}`}
          />
        </div>
        <div className={`dropdown-body ${isOpen && "open"}`}>
          {items.map((item) => (
            <div
              className="dropdown-item"
              onClick={() => handleItemClick(item.id)}
              id={item.id}
              key={item.id}
            >
              <span
                className={`dropdown-item-dot ${
                  item.id === selectedItem && "selected"
                }`}
              >
                •{" "}
              </span>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const theme = [
    { id: 0, label: "Free Talk" },
    { id: 1, label: "Cafe" },
    { id: 2, label: "School" },
    { id: 3, label: "Third Grade Level" },
    { id: 4, label: "Graduate Level" },
    { id: 5, label: "News Level" },
  ];

  const [showLevels, setShowLevels] = useState(false);

  const handleItemClick = (id) => {
    setSelectedTheme(parseInt(id));
    if (id === 3) {
      setShowLevels(!showLevels);
    }
  };
  const handleChange = (event, newValue) => {
    setSelectedTheme(parseInt(newValue));
    if (parseInt(newValue) === 3) {
      setShowLevels(!showLevels);
    }
  };
  const firstThreeItems = theme.slice(0, 3);
  const remainingItems = theme.slice(3);

  const ThemeDropdown = ({ items, selectedTheme, handleItemClick }) => {
    const [isOpen, setOpen] = useState(false);

    const toggleDropdown = () => setOpen(!isOpen);

    return (
      <div className="dropdown">
        <div className="dropdown-header" onClick={toggleDropdown}>
          {items.find((item) => item.id === selectedTheme)?.label}
          <FontAwesomeIcon
            icon={faChevronRight}
            className={`icon ${isOpen && "open"}`}
          />
        </div>
        <div className={`dropdown-body ${isOpen && "open"}`}>
          {items.map((item) => (
            <div
              className="dropdown-item"
              onClick={() => handleItemClick(item.id)}
              id={item.id}
              key={item.id}
            >
              <span
                className={`dropdown-item-dot ${
                  item.id === selectedTheme && "selected"
                }`}
              >
                •{" "}
              </span>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const messages_test = [
    "Message 1",
    "Message 2",
    "Message 3",
    "Message 4",
    "Message 5",
  ];
  const csvData = [["AiTeacher", "Student"]];
  for (let i = 0; i < messages.length; i++) {
    if (i % 2 === 0) {
      // Every even-indexed message
      const row = [messages[i].message.replace(/[^\w\s\n]/g, ""), ""]; // First column contains the message, second column is blank
      csvData.push(row); // Push the row to csvData
    } else {
      // Every odd-indexed message
      const row = ["", messages[i].message.replace(/[^\w\s\n]/g, "")]; // First column is blank, second column contains the message
      csvData.push(row); // Push the row to csvData
    }
  }

  function generateCsv() {
    // console.log(csvData[1].replace(/[\n\W_]+/g, ' '))
    csvLink.current.link.click();
  }

  var animationFrameId = null;

  function startMouthAnimation() {
    const mouthOpenYParam = "ParamMouthOpenY";
    const mouthFormParam = "ParamMouthForm";

    let time = 0;

    const updateMouthAnimation = () => {
      const coreModel = selectedModel.internalModel.coreModel;

      // Calculate the mouth animation values based on time
      const mouthOpenY = Math.sin(time) * 0.9;
      const mouthForm = 0.7 + Math.sin(time * 0.5) * 0.1;

      // Set the parameter values for mouth animation
      coreModel.setParameterValueById(mouthOpenYParam, mouthOpenY);
      coreModel.setParameterValueById(mouthFormParam, mouthForm);

      // Increment the time for the next frame
      time += 0.2; // Adjust the speed as needed

      // Request the next animation frame
      animationFrameId = requestAnimationFrame(updateMouthAnimation);
    };

    // Start the mouth animation loop
    updateMouthAnimation();
  }

  function stopMouthAnimation() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    const coreModel = selectedModel.internalModel.coreModel;

    // Reset the mouth animation parameter values to their default state
    coreModel.setParameterValueById("ParamMouthOpenY", 0);
    coreModel.setParameterValueById("ParamMouthForm", 0);
  }

  return (
    <div className="App">
      <div className="container">
        <div className="textToSpeechContainer">
          <div className="avatarContainer">
            {/* <div className="themeContainer">
							<h3>Choose Theme: </h3>
							<ThemeDropdown />

						</div> */}

            {/* <Select
              defaultValue="0"
              onChange={handleChange}
              placeholder="Select a Theme"
            >
              <Option value="0">Free Talk</Option>
              <Option value="1">Cafe</Option>
              <Option value="2">School</Option>
            </Select>
            <Select
              onChange={handleChange}
              placeholder="Select a Pronunciation"
            >
              <Option value="3">Third Grade Level</Option>
              <Option value="4">Graduate Level</Option>
              <Option value="5">News Level</Option>
            </Select> */}
            <div className="themeContainer">
              <div className="">
                <p>Theme</p>
                <ThemeDropdown
                  items={firstThreeItems}
                  selectedTheme={selectedTheme}
                  handleItemClick={handleItemClick}
                />
              </div>

              <div>
                <p>Pronunciation</p>
                <ThemeDropdown
                  items={remainingItems}
                  selectedTheme={selectedTheme}
                  handleItemClick={handleItemClick}
                />
              </div>
            </div>
            {/* <img
              className="avatar"
              id="avatar"
              src={
                selectedTheme === 0
                  ? freetalk
                  : selectedTheme === 1
                  ? cafe
                  : selectedTheme === 2
                  ? school
                  : selectedTheme === 3
                  ? prononciation
                  : cafe // The default option if none of the themes match
              }
              alt="avatar"
            /> */}
            <canvas id="canvas" className="avatar" />
          </div>
          <div className="buttonsContainer">
            <div className="buttons">
              <SpeechToText />
              <TextToSpeech generatedText={generatedText} />
              {/* <LanguageDropdown /> */}
            </div>
          </div>
          <div>
            <CSVLink
              data={csvData}
              filename="chat-history.csv"
              ref={csvLink}
            ></CSVLink>
          </div>
        </div>
        <div className="chatContainer">
          <div style={{ height: "100vh" }}>
            <MainContainer>
              <ChatContainer>
                <ConversationHeader>
                  {/* <Avatar src={icon} name="Akane" /> */}
                  {/* <ConversationHeader.Content
                    userName={
                      selectedTheme === 0
                        ? "Friend Kayndis"
                        : selectedTheme === 1
                        ? "Barista Jessy"
                        : selectedTheme === 2
                        ? "Professor Clerk"
                        : selectedTheme === 3
                        ? "Prononciation Checker John (Junior high school third grade level)"
                        : selectedTheme === 4
                        ? "Prononciation Checker John (High school graduate level)"
                        : selectedTheme === 5
                        ? "Prononciation Checker John (News level)"
                        : "ChatGPT"
                    }
                    info="Active Now"
                  /> */}
                </ConversationHeader>
                <MessageList
                  scrollBehavior="smooth"
                  typingIndicator={
                    typing ? (
                      <TypingIndicator content="Your AI Teacher is typing" />
                    ) : convertProcess === true ? (
                      <TypingIndicator content="Converting text..." />
                    ) : null
                  }
                >
                  {messages.map((message, index) => {
                    return (
                      <Message key={index} model={message}>
                        {/* <Avatar src={icon} name="Joe" size="md" /> */}
                      </Message>
                    );
                  })}
                </MessageList>
                <div as="MessageInput">
                  <MessageInput
                    placeholder="Type message here"
                    onSend={handleSend}
                    autoFocus
                    onAttachClick={() => generateCsv()}
                    attachButton={true}
                  ></MessageInput>
                </div>
              </ChatContainer>
            </MainContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
