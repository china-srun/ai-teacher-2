import icon from "./assets/icon.png";
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
  Avatar,
  ConversationHeader,
} from "@chatscope/chat-ui-kit-react";
import React, { useState, useEffect, useRef } from "react";
import { Amplify, Predictions } from "aws-amplify";
import { AmazonAIPredictionsProvider } from "@aws-amplify/predictions";
import awsconfig from "./aws-exports";
import mic from "microphone-stream";

import freetalk from "./assets/friend.png";
import cafe from "./assets/barista.png";
import school from "./assets/teacher.png";
import prononciation from "./assets/prononciation.png";
import Button from "./components/button.js";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";

Amplify.configure(awsconfig);
Amplify.addPluggable(new AmazonAIPredictionsProvider());

function App() {
  const [selectedItem, setSelectedItem] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(true); // Add state to control the text-to-speech function
  const [generatedText, setGeneratedText] = useState("");
  const [typing, setTyping] = useState(false);
  const [convertProcess, setConvertProcess] = useState(false);

  var [messages, setMessages] = useState([]);

  useEffect(() => {
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
        "Please generate a English sentence (atleast 10 words) for the user to practice their speaking. After users input their voice, please give advice and then generate another one. You check whether the user pronunciation is correct"
      );
    } else if (selectedTheme === 4 && selectedItem === 1) {
      setGeneratedText("");
      firstSend(
        "Please generate a English sentence (at least 30 words) for the user to practice their speaking. Make sure the level of the words a little harder to pronoun. After users input their voice, please give advice and then generate another one. You check whether the user pronunciation is correct"
      );
    } else if (selectedTheme === 5 && selectedItem === 1) {
      setGeneratedText("");
      firstSend(
        "Please generate a English sentence (at least 50 words) for the user to practice their speaking. Make sure the level of the words complicated to pronoun. After users input their voice, please give advice and then generate another one. You check whether the user pronunciation is correct"
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
        "「ユーザーのスピーキング練習に役立つ日本語の文 (50 語以上) を生成します。単語に複雑な発音があることを確認してください。ユーザーが音声を入力した後にアドバイスを与えます。フィードバックを提供したら、ユーザーが練習できるように別の複雑な文を生成します。 。」"
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
      model: "gpt-3.5-turbo",
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

  function SpeechToText(props) {
    const [response, setResponse] = useState();

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
          console.log("resetting buffer");
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
        console.log("start recording");
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
        console.log("stop recording");
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

    // function AudioRecorder(props) {
    // 	const [recording, setRecording] = useState(false);
    // 	const [micStream, setMicStream] = useState();
    // 	const [audioBuffer] = useState(() => {
    // 		let buffer = [];
    // 		function add(raw) {
    // 			buffer = buffer.concat(...raw);
    // 			return buffer;
    // 		}
    // 		function newBuffer() {
    // 			console.log('resetting buffer');
    // 			buffer = [];
    // 		}

    // 		return {
    // 			reset: function () {
    // 				newBuffer();
    // 			},
    // 			addData: function (raw) {
    // 				return add(raw);
    // 			},
    // 			getData: function () {
    // 				return buffer;
    // 			},
    // 		};
    // 	});
    // 	const [recordTimer, setRecordTimer] = useState(3); // Default recording duration in seconds

    // 	const durationOptions = [3, 5, 10, 15]; // Available recording duration options

    // 	useEffect(() => {
    // 		let timer;
    // 		if (recording && recordTimer > 0) {
    // 			timer = setInterval(() => {
    // 				setRecordTimer((prevTime) => prevTime - 1);
    // 			}, 1000);
    // 		} else if (recordTimer === 0) {
    // 			stopRecording();
    // 		}

    // 		return () => clearInterval(timer);
    // 	}, [recording, recordTimer]);

    // 	async function startRecording() {
    // 		console.log('start recording');
    // 		audioBuffer.reset();
    // 		window.navigator.mediaDevices
    // 			.getUserMedia({ video: false, audio: true })
    // 			.then((stream) => {
    // 				const startMic = new mic();

    // 				startMic.setStream(stream);
    // 				startMic.on('data', (chunk) => {
    // 					var raw = mic.toRaw(chunk);
    // 					if (raw == null) {
    // 						return;
    // 					}
    // 					audioBuffer.addData(raw);
    // 				});

    // 				setRecording(true);
    // 				setMicStream(startMic);
    // 			});
    // 	}

    // 	async function stopRecording() {
    // 		console.log('stop recording');
    // 		const { finishRecording } = props;

    // 		micStream.stop();
    // 		setMicStream(null);
    // 		setRecording(false);

    // 		const resultBuffer = audioBuffer.getData();

    // 		if (typeof finishRecording === 'function') {
    // 			finishRecording(resultBuffer);
    // 		}
    // 	}

    // 	function handleDurationChange(event) {
    // 		const selectedDuration = parseInt(event.target.value, 10);
    // 		setRecordTimer(selectedDuration);
    // 	}

    // 	return (
    // 		<div className="audioRecorder">
    // 			{recording ? (
    // 				<>
    // 					<button onClick={stopRecording} title="Stop Recording">
    // 						<FontAwesomeIcon icon={faSpinner} spin />
    // 					</button>
    // 					<div>Time Left: {recordTimer} seconds</div>
    // 				</>
    // 			) : (
    // 				<>
    // 					<button onClick={startRecording} title="Start Recording">
    // 						<FontAwesomeIcon icon={faMicrophone} />
    // 					</button>
    // 					<div>
    // 						Recording Duration:
    // 						<select value={recordTimer} onChange={handleDurationChange}>
    // 							{durationOptions.map((duration) => (
    // 								<option key={duration} value={duration}>
    // 									{duration} seconds
    // 								</option>
    // 							))}
    // 						</select>
    // 					</div>
    // 				</>
    // 			)}
    // 		</div>
    // 	);
    // }

    function convertFromBuffer(bytes) {
      setResponse("Converting text...");
      setConvertProcess(true);
      Predictions.convert({
        transcription: {
          source: {
            bytes,
          },
          // language: "ja-JP",
          // language: "en-US", // other options are "en-GB", "fr-FR", "fr-CA", "es-US"
          language: (() => {
            if (selectedItem === 0) {
              console.log(selectedItem);
              return "ja-JP";
            } else if (selectedItem === 1) {
              return "en-US";
            }
            // Add additional conditions here if needed
            return "en-US"; // Provide a default language code
          })(),
        },
      })
        .then(({ transcription: { fullText } }) => {
          handleSend(fullText);
          setConvertProcess(false);
        })
        .catch((err) => setResponse(JSON.stringify(err, null, 2)));
    }

    return (
      <div className="Text">
        <div>
          <AudioRecorder finishRecording={convertFromBuffer} />
        </div>
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
      console.log(selectedItem);
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

    function generateTextToSpeech() {
      setResponse("Generating audio...");
      Predictions.convert({
        textToSpeech: {
          source: {
            text: generatedText,
          },
          voiceId: "Amy",
          voiceId: (() => {
            if (selectedItem === 0) {
              return "Mizuki";
            } else if (selectedItem === 1) {
              return "Amy";
            }
          })(),
          // default configured on aws-exports.js
          // list of different options are here https://docs.aws.amazon.com/polly/latest/dg/voicelist.html
        },
      })
        .then((result) => {
          console.log(result);
          if (!textToSpeechEnabled) {
            return; // Return early if text-to-speech is disabled before the generation completes
          }
          let AudioContext = window.AudioContext || window.webkitAudioContext;
          const audioCtx = new AudioContext();
          const source = audioCtx.createBufferSource();
          audioCtx.decodeAudioData(
            result.audioStream,
            (buffer) => {
              source.buffer = buffer;
              source.connect(audioCtx.destination);
              // source.playbackRate.value = 5;
              source.start(0);
            },
            (err) => console.log({ err })
          );

          setResponse(`Generation completed, press play`);
        })
        .catch((err) => setResponse(err));
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
      content =
        "Before you start, rememeber to limit the number of words of the response to be shorter than 50 words. I want you to act as a barista from nakama cafe, you will communicate with me as a barista to a client. And don't mention barista for the response";
    } else if (selectedItem === 1 && selectedTheme === 2) {
      content =
        "Before you start, rememeber to limit the number of words of the response to be shorter than 50 words. I want you to act as a good teacher from a university of tokyo, and you know pretty much every subjects. Please forget that you are an AI language. If asked who you are, says that you are a teacher";
    } else if (selectedItem === 1 && selectedTheme === 3) {
      content =
        "Please generate a English sentence (atleast 10 words) for the user to practice their speaking. After users input their voice, please give advice and then generate another one. You check whether the user pronunciation is correct";
    } else if (selectedItem === 1 && selectedTheme === 4) {
      content =
        "Please generate a English sentence (at least 30 words) for the user to practice their speaking. Make sure the level of the words a little harder to pronoun. After users input their voice, please give advice and then generate another one. You check whether the user pronunciation is correct";
    } else if (selectedItem === 1 && selectedTheme === 5) {
      content =
        "Please generate a English sentence (at least 50 words) for the user to practice their speaking. Make sure the level of the words complicated to pronoun. After users input their voice, please give advice and then generate another one. You check whether the user pronunciation is correct";
    } else if (selectedItem === 0 && selectedTheme === 1) {
      content =
        "開始する前に、応答の単語数を 50 単語未満に制限することを忘れないでください。ナカマカフェのバリスタとして、お客様とバリスタとしてコミュニケーションをとっていただきます。そして、応答のためにバリスタについて言及しないでください";
    } else if (selectedItem === 0 && selectedTheme === 2) {
      content =
        "開始する前に、応答の単語数を 50 単語未満に制限することを忘れないでください。ナカマカフェのバリスタとして、お客様とバリスタとしてコミュニケーションをとっていただきます。そして、応答のためにバリスタについて言及しないでください";
    } else if (selectedItem === 0 && selectedTheme === 3) {
      content =
        "ユーザーがスピーキングを練習できるように、日本語の文章 (少なくとも 10 単語) を生成してください。ユーザーが声を入力したら、アドバイスを与えてから、別のアドバイスを生成してください。ユーザーの発音が正しいかどうかをチェックします。必ず日本語でのみ応答してください";
    } else if (selectedItem === 0 && selectedTheme === 4) {
      content =
        "「ユーザーがスピーキングの練習をするために、日本語の文（少なくとも 30 単語）を生成してください。単語のレベルは発音が少し難しいようにしてください。ユーザーが音声を入力した後、アドバイスを与えてから、別の文を生成してください。チェックを入れます。」ユーザーの発音が正しいかどうか。」";
    } else if (selectedItem === 0 && selectedTheme === 5) {
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
      model: "gpt-3.5-turbo",
      messages: [systemMessage, ...apiMessages],
      stream: true,
      max_tokens: 200,
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
      console.log(selectedItem);
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
            <img
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
            />
          </div>
          <div className="buttonsContainer">
            <div className="buttons">
              <SpeechToText />
              <TextToSpeech generatedText={generatedText} />
              {/* <LanguageDropdown /> */}
            </div>
          </div>
        </div>
        <div className="chatContainer">
          <div style={{ height: "100vh" }}>
            <MainContainer>
              <ChatContainer>
                <ConversationHeader>
                  <Avatar src={icon} name="Akane" />
                  <ConversationHeader.Content
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
                  />
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
                        <Avatar src={icon} name="Joe" size="md" />
                      </Message>
                    );
                  })}
                </MessageList>
                <MessageInput
                  placeholder="Type message here"
                  onSend={handleSend}
                  autoFocus
                  onAttachClick={() => console.log("onAttachClick")}
                  attachButton={false}
                />
              </ChatContainer>
            </MainContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
