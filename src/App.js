import icon from "./assets/icon.png";
import "./App.css";
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

Amplify.configure(awsconfig);
Amplify.addPluggable(new AmazonAIPredictionsProvider());

function App() {
  const [selectedItem, setSelectedItem] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(true); // Add state to control the text-to-speech function
  const [generatedText, setGeneratedText] = useState("");
  const [typing, setTyping] = useState(false);
  const [convertProcess, setConvertProcess] = useState(false);
  let AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  const source = audioCtx.createBufferSource();

  var [messages, setMessages] = useState([]);

  useEffect(() => {
    if (selectedTheme === 0) {
      setGeneratedText("");
      setMessages([
        {
          message:
            "Hello there, Is there anything you want to discuss with me?",
          sender: "user",
        },
      ]);
    } else if (selectedTheme === 1) {
      setGeneratedText("");
      setMessages([
        {
          message:
            "Hey there! Welcome to Nakama Cafe. How can I assist you today?",
          sender: "user",
        },
      ]);
    } else if (selectedTheme === 2) {
      setGeneratedText("");
      setMessages([
        {
          message:
            "Hello! As a teacher from the University of Tokyo, I'm here to help and provide information. If you have any questions or need assistance with any educational or academic topics, please feel free to ask.",
          sender: "user",
        },
      ]);
    } else if (selectedTheme === 3) {
      setGeneratedText("");
      firstSend(
        "I want you to act as a pronunciation checker. The user is an English learner of an elementary level. The user will put the message using their voice and you check for their pronunciation,  point out their mistakes and give some advice. After that, generate another sentence for the user to practice with the length of 45 words and continue to improve the generated sentence. Don’t have to repeat the old sentence. However, first of all, please generate a sample sentence for the user to practice and put it at the beginning of the response."
      );
    } else if (selectedTheme === 4) {
      setGeneratedText("");
      firstSend(
        "I want you to act as a pronunciation checker. The user is an English learner of an pre-intermediate level. The user will put the message using their voice and you check for their pronunciation,  point out their mistakes and give some advice. After that, generate another sentence for the user to practice with the length of 45 words and continue to improve the generated sentence. Don’t have to repeat the old sentence. However, first of all, please generate a sample sentence for the user to practice and put it at the beginning of the response."
      );
    } else if (selectedTheme === 5) {
      setGeneratedText("");
      firstSend(
        "I want you to act as a pronunciation checker. The user is an English learner of an elementary level. The user will put the message using their voice and you check for their pronunciation,  point out their mistakes and give some advice. After that, generate another sentence for the user to practice with the length of 45 words and continue to improve the generated sentence. Don’t have to repeat the old sentence. However, first of all, please generate a sample sentence for the user to practice and put it at the beginning of the response."
      );
    }
  }, [selectedTheme]);

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

      const [selectedDuration, setSelectedDuration] = useState(5);
      const durationOptions = [3, 5, 10, 15, 30, 40, 50, 60]; // Available recording duration options
      const [isOpen, setOpen] = useState(false);

      const toggleDropdown = () => setOpen(!isOpen);

      useEffect(() => {
        let timer;
        if (recording && selectedDuration > 0) {
          timer = setInterval(() => {
            setSelectedDuration((prevDuration) => prevDuration - 1);
          }, 1000);
        } else if (selectedDuration === 0) {
          stopRecording();
          setSelectedDuration(0); // Reset the timer to 0 when it reaches zero
        }

        return () => clearInterval(timer);
      }, [recording, selectedDuration]);

      const startRecording = async () => {
        console.log("start recording");
        audioBuffer.reset();
        setSelectedDuration(selectedDuration); // Use the selected duration
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
      };

      const handleDurationChange = (duration) => {
        setSelectedDuration(duration);
        toggleDropdown(); // Close the dropdown when a duration is selected
      };

      return (
        <div className="audioRecorder">
          {recording ? (
            <>
              <button onClick={stopRecording} title="Stop Recording">
                <FontAwesomeIcon icon={faSpinner} spin />
              </button>
              <div>Time Left: {selectedDuration} seconds</div>
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

          audioCtx.decodeAudioData(
            result.audioStream,
            (buffer) => {
              source.buffer = buffer;
              source.connect(audioCtx.destination);
              // source.playbackRate.value = 5;
              source.start();

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
        <div>
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
    if (selectedTheme === 0) {
      content = "You are free to say anything";
    } else if (selectedTheme === 1) {
      content =
        "I want you to act as a barista from nakama cafe, you will communicate with me as a barista to a client. And don't mention barista for the response";
    } else if (selectedTheme === 2) {
      content =
        "I want you to act as a good teacher from a university of tokyo, and you know pretty much every subjects. Please forget that you are an AI language. If asked who you are, says that you are a teacher";
    } else if (selectedTheme === 3) {
      content =
        "I want you to act as a pronunciation checker. The user is an English learner of an elementary level. The user will put the message using their voice and you check for their pronunciation,  point out their mistakes and give some advice. After that, generate another sentence for the user to practice with the length of 45 words and continue to improve the generated sentence. Don’t have to repeat the old sentence. However, first of all, please generate a sample sentence for the user to practice and put it at the beginning of the response.";
    } else if (selectedTheme === 4) {
      content =
        "I want you to act as a pronunciation checker. The user is an English learner of an pre-intermediate level. The user will put the message using their voice and you check for their pronunciation,  point out their mistakes and give some advice. After that, generate another sentence for the user to practice with the length of 45 words and continue to improve the generated sentence. Don’t have to repeat the old sentence. However, first of all, please generate a sample sentence for the user to practice and put it at the beginning of the response.";
    } else if (selectedTheme === 5) {
      content =
        "I want you to act as a pronunciation checker. The user is an English learner of an elementary level. The user will put the message using their voice and you check for their pronunciation,  point out their mistakes and give some advice. After that, generate another sentence for the user to practice with the length of 45 words and continue to improve the generated sentence. Don’t have to repeat the old sentence. However, first of all, please generate a sample sentence for the user to practice and put it at the beginning of the response.";
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
      max_tokens: 150,
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
    setSelectedTheme(id);
    if (id === 3) {
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
            <div className="themeContainer">
              <div>
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
              <LanguageDropdown />
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
