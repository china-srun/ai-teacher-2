import logo from "./logo.svg";
import "./App.css";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { faVolumeUp, faVolumeMute, faMicrophone, faSpinner, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
	MainContainer,
	ChatContainer,
	MessageList,
	Message,
	MessageInput,
	TypingIndicator,
	Avatar,
} from "@chatscope/chat-ui-kit-react";
import React, { useState, useEffect } from "react";
import { Amplify, Predictions } from "aws-amplify";
import { AmazonAIPredictionsProvider } from "@aws-amplify/predictions";
import awsconfig from "./aws-exports";
import mic from "microphone-stream";
import avatar from './assets/bg_character_.png';


Amplify.configure(awsconfig);
Amplify.addPluggable(new AmazonAIPredictionsProvider());

function App() {
	const [selectedItem, setSelectedItem] = useState(0);
	const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(true); // Add state to control the text-to-speech function
	const [generatedText, setGeneratedText] = useState("");
	const [typing, setTyping] = useState(false);
	const [convertProcess, setConvertProcess] = useState(false);
	const [messages, setMessages] = useState([
		{
			message: "Hello!",
			sender: "user",
		},
	]);
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

	function SpeechToText(props) {
		const [response, setResponse] = useState();

		function AudioRecorder(props) {
			const [recording, setRecording] = useState(false);
			const [micStream, setMicStream] = useState();
			const [audioBuffer] = useState(
				(function () {
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
				})()
			);

			async function startRecording() {
				console.log("start recording");
				audioBuffer.reset();
				window.navigator.mediaDevices
					.getUserMedia({ video: false, audio: true })
					.then((stream) => {
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

					});
			}

			async function stopRecording() {
				console.log("stop recording");
				const { finishRecording } = props;

				micStream.stop();
				setMicStream(null);
				setRecording(false);

				const resultBuffer = audioBuffer.getData();

				if (typeof finishRecording === "function") {
					finishRecording(resultBuffer);
				}
			}

			return (
				<div className="audioRecorder">
					<div>
						{recording ? (
							<button onClick={stopRecording} title="Stop Recording">
								<FontAwesomeIcon icon={faSpinner} spin /> {/* Show the spinning icon while processing */}
							</button>
						) : (
							<button onClick={startRecording} title="Start Recording">
								<FontAwesomeIcon icon={faMicrophone} /> {/* Show the microphone icon when not recording */}
							</button>
						)}
					</div>
				</div>
			);
		}

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
							console.log(selectedItem)
							return "ja-JP";
						} else if (selectedItem === 1) {
							return "en-US";
						}
						// Add additional conditions here if needed
						return "en-US"; // Provide a default language code
					})()

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
			if (generatedText && textToSpeechEnabled) { // Check if the text-to-speech is enabled before generating
				generateTextToSpeech();
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
					})()
					// default configured on aws-exports.js
					// list of different options are here https://docs.aws.amazon.com/polly/latest/dg/voicelist.html
				},
			})
				.then((result) => {
					if (!textToSpeechEnabled) {
						return; // Return early if text-to-speech is disabled before the generation completes
					}
					let AudioContext = window.AudioContext || window.webkitAudioContext;
					console.log({ AudioContext });
					const audioCtx = new AudioContext();
					const source = audioCtx.createBufferSource();
					audioCtx.decodeAudioData(
						result.audioStream,
						(buffer) => {
							source.buffer = buffer;
							source.connect(audioCtx.destination);
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
				<div>
					<button onClick={toggleTextToSpeech} title={textToSpeechEnabled ? "Disable Text-to-Speech" : "Enable Text-to-Speech"}>
						{textToSpeechEnabled ? <FontAwesomeIcon icon={faVolumeUp} /> : <FontAwesomeIcon icon={faVolumeMute} />}
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

		const systemMessage = {
			role: "system",
			content: "Pretend you are my teacher and try to make the response a little shorter"
			// content:
			// 	"Pretend you are my teacher and response in Japanese. Please provide the english version below the japanese version",
		};

		const apiRequestBody = {
			model: "gpt-3.5-turbo",
			messages: [systemMessage, ...apiMessages],
			stream: true,
			max_tokens: 100,
		};
		const res = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(apiRequestBody),

		})
		const reader = res.body.getReader();
		let accumulatedContent = "";
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}
			// Massage and parse the chunk of data
			const chunk = decoder.decode(value);
			const lines = chunk.split('\n');
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
		setGeneratedText("")
	}

	const data = [
		{ id: 0, label: "Japanese" },
		{ id: 1, label: "English" }
	];


	const Dropdown = () => {
		const [isOpen, setOpen] = useState(false);
		const [items, setItem] = useState(data);
		const toggleDropdown = () => setOpen(!isOpen);

		const handleItemClick = (id) => {
			setSelectedItem(id)
			console.log(selectedItem)
		}


		return (
			<div className='dropdown'>
				<div className='dropdown-header' onClick={toggleDropdown}>
					{items.find(item => item.id === selectedItem).label}
					<FontAwesomeIcon icon={faChevronRight} className={`icon ${isOpen && "open"}`} />
				</div>
				<div className={`dropdown-body ${isOpen && 'open'}`}>
					{items.map(item => (
						<div className="dropdown-item" onClick={() => handleItemClick(item.id)} id={item.id} key={item.id}>
							<span className={`dropdown-item-dot ${item.id === selectedItem && 'selected'}`}>• </span>
							{item.label}
						</div>
					))}
				</div>
			</div>
		)
	}

	return (
		<div className="App">
			<div className="container">
				<div className="textToSpeechContainer">
					<div className="avatarContainer">
						<img className="avatar" id="avatar" src={avatar} alt="avatar" />
					</div>
					<div className="buttonsContainer">
						<div className="buttons">
							<SpeechToText />
							<TextToSpeech generatedText={generatedText} />
							<Dropdown />
						</div>
					</div>
				</div>
				<div className="chatContainer">
					<div style={{ height: "100vh" }}>
						<MainContainer>
							<ChatContainer>
								<MessageList
									scrollBehavior="smooth"
									typingIndicator={
										typing ? (
											<TypingIndicator content="Your AI Teacher is typing" />
										) : (convertProcess === true ? <TypingIndicator content="Converting text..." /> : null)
									}

								>
									{messages.map((message, index) => {
										return (
											<Message key={index} model={message}>
												<Avatar src={logo} name="Joe" size="md" />
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
