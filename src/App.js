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
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../src/libs/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
import { useHotkeys } from "react-hotkeys-hook";
import Modal from "./components/Modal";
import CustomRadioButton from "./components/language";
import emailjs from "@emailjs/browser";
emailjs.init({
  publicKey: "OBQBNn5U_qbZj7iB5",
  // Do not allow headless browsers
  blockHeadless: true,
  blockList: {
    // Block the suspended emails
    list: ["foo@emailjs.com", "bar@emailjs.com"],
    // The variable contains the email address
    watchVariable: "china.srunn@gmail.com",
  },
  limitRate: {
    // Set the limit rate for the application
    id: "app",
    // Allow 1 request per 10s
    throttle: 10000,
  },
});
window.PIXI = PIXI;

Live2DModel.registerTicker(PIXI.Ticker);

Amplify.configure(awsconfig);
Amplify.addPluggable(new AmazonAIPredictionsProvider());

const CSVDialog = ({ isOpen, onClose, messages, evaluatedConversation }) => {
  const [emails, setEmails] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const fetchEmails = async () => {
      if (isOpen) {
        setIsLoading(true);
        try {
          const querySnapshot = await getDocs(collection(db, "teacher_emails"));
          const emailList = querySnapshot.docs.map((doc) => doc.data().email);
          setEmails(emailList);
        } catch (error) {
          console.error("Error fetching emails from Firebase:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchEmails();
  }, [isOpen]);

  // Generate CSV data dynamically from messages
  const generateCsvData = () => {
    const csvData = [["AiTeacher", "Student"]];

    // Add messages to CSV table
    for (let i = 0; i < messages.length; i++) {
      if (i % 2 === 0) {
        csvData.push([messages[i].message.replace(/[^\w\s\n]/g, ""), ""]);
      } else {
        csvData.push(["", messages[i].message.replace(/[^\w\s\n]/g, "")]);
      }
    }

    // Convert the table data to CSV format
    let csvContent = csvData.map((row) => row.join(",")).join("\n");

    // Add evaluated conversation outside of the table
    if (evaluatedConversation) {
      const englishText = evaluatedConversation.english;
      const japaneseText = evaluatedConversation.japanese;

      // Add a separator for better clarity
      csvContent += `\nEvaluated Conversation (English):,${englishText}`;
      csvContent += `\nEvaluated Conversation (Japanese):,${japaneseText}`;
    }

    return csvContent;
  };

  // Handle CSV file download
  const handleDownloadCsv = () => {
    const csvContent = generateCsvData();
    const blob = new Blob([csvContent], { type: "text/csv" });

    // Create a link to download the CSV
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `chat-history-${Date.now()}.csv`; // Set the filename with a timestamp
    link.click(); // Programmatically click the link to trigger the download
  };

  const handleEmailInputChange = (event) => {
    setEmailInput(event.target.value);
  };

  const handleAddEmail = async () => {
    // Check if the email is empty or doesn't contain "@"
    if (
      !emailInput ||
      !emailInput.includes("@") ||
      emailInput.indexOf("@") === emailInput.length - 1
    ) {
      alert("Please enter a valid email address.");
      return;
    }

    // Check if the email ends with .com (can be extended to other domains like .org, .net, etc.)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailInput)) {
      alert(
        "Please enter a valid email address with a proper domain (e.g., example@domain.com)."
      );
      return;
    }

    // Prevent adding if the email already exists
    if (emails.includes(emailInput)) {
      alert("This email already exists.");
      return;
    }

    try {
      await addDoc(collection(db, "teacher_emails"), { email: emailInput });
      setEmails((prevEmails) => [...prevEmails, emailInput]);
      setEmailInput("");
    } catch (error) {
      console.error("Error adding email to Firebase:", error);
    }
  };

  const handleSendEmail = async () => {
    if (!emailInput || !emailInput.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    const csvContent = generateCsvData();
    const blob = new Blob([csvContent], { type: "text/csv" });

    // 🔹 Upload to Firebase Storage
    const storageRef = getStorage();
    const fileRef = ref(storageRef, `csv-files/chat-history-${Date.now()}.csv`);

    try {
      setIsProcessing(true); // set processing to true when sending email
      const snapshot = await uploadBytes(fileRef, blob);
      const fileUrl = await getDownloadURL(snapshot.ref); // ✅ Get the download URL

      // 🔹 Send email with the file URL instead of attaching the file
      const templateParams = {
        to_email: emailInput,
        download_link: fileUrl, // ✅ Send the link instead of file data
        message: "Click the link below to download your CSV file:",
      };

      await emailjs.send(
        "service_zx039uf",
        "template_urmuzuu",
        templateParams,
        "OBQBNn5U_qbZj7iB5"
      );
      console.log(fileUrl);
      alert("Email sent successfully with the CSV download link!");
    } catch (error) {
      console.error("Error uploading file or sending email:", error);
      alert("Failed to send email.");
    } finally {
      setIsProcessing(false); // reset processing after completion
    }
  };

  useEffect(() => {
    if (evaluatedConversation === "") {
      setIsEvaluating(true); // Show loading icon if conversation is being processed
    } else {
      setIsEvaluating(false); // Hide loading icon once conversation is ready
    }
  }, [evaluatedConversation]);

  if (!isOpen) return null;

  // Filter emails based on emailInput value
  const filteredEmails = emails.filter((email) =>
    email.toLowerCase().includes(emailInput.toLowerCase())
  );

  return (
    <div className="dialog-overlay">
      <div className="dialog-container">
        <h2 className="dialog-title">Generate CSV File</h2>
        <p className="dialog-message">
          Select an email or add a new one to receive the CSV file. The file
          will be attached to the email.
        </p>

        <div className="dialog-email-input">
          <label htmlFor="email-input" className="dialog-label">
            Enter Email:
          </label>
          <input
            id="email-input"
            type="email"
            value={emailInput}
            onChange={handleEmailInputChange}
            placeholder="Type to search or add email"
            className="dialog-input"
          />
          <button
            className="dialog-button add-button"
            onClick={handleAddEmail}
            disabled={!emailInput || !emailInput.includes("@")}
          >
            Add Email
          </button>
        </div>

        {isLoading ? (
          <p>Loading emails...</p>
        ) : filteredEmails.length === 0 ? (
          <p>No emails found. Please add an email.</p> // Show if no search results
        ) : (
          <ul className="dialog-email-list">
            {filteredEmails.map((email, index) => (
              <li
                key={index}
                className="dialog-email-item"
                onClick={() => setEmailInput(email)}
              >
                {email}
              </li>
            ))}
          </ul>
        )}

        <div className="dialog-actions">
          <button
            className="dialog-button download-button"
            onClick={handleDownloadCsv}
            disabled={isEvaluating} // Disable the download button while evaluating
          >
            Download CSV
          </button>
          <button
            className="dialog-button toggle-language-button"
            onClick={() => setLanguage(language === "en" ? "jp" : "en")}
          >
            {language === "en" ? "Japanese" : "English"}
          </button>
          <button className="dialog-button cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="dialog-button confirm-button"
            onClick={handleSendEmail}
            disabled={!emailInput || !emailInput.includes("@")}
          >
            Send Email
          </button>
        </div>

        {isEvaluating ? (
          <div className="loading-icon">
            <p>Evaluating conversation...</p>
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="evaluated-conversation">
            {language === "en"
              ? evaluatedConversation.english
              : evaluatedConversation.japanese}
          </div>
        )}
      </div>
    </div>
  );
};

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
  const [source, setSource] = useState();
  const [open, setOpen] = useState(true);
  const [showLevel, setShowLevel] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [selectedValue, setSelectedValue] = useState("english");
  const [language, setLanguage] = useState("please respond in english");
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [evaluatedConversation, setEvaluatedConversation] = useState("");
  const [isEvaluated, setIsEvaluated] = useState(false); // Track if evaluation is done

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  useEffect(() => {
    if (selectedValue === "english") {
      setLanguage("please respond in English");
    } else if (selectedValue === "japanese") {
      setLanguage("please respond in Japanese");
    }
  }, [selectedValue, language]);

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

      const updateModelPosition = () => {
        const { innerWidth, innerHeight } = window;

        const xPosition = innerWidth / 2;
        const yPosition = innerHeight / 2;

        model.position.set(xPosition, yPosition);

        if (innerWidth < 1600) {
          model.scale.set(0.16, 0.16);
        } else {
          model.scale.set(0.2, 0.2);
        }
      };

      updateModelPosition();

      window.addEventListener("resize", updateModelPosition);

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
      if (selectedLevel === 0) {
      } else {
        switch (selectedLevel) {
          case 1:
            setGeneratedText("");
            firstSend(
              `You are a teacher who pretends to be a barista from a cafe called 'Nakama'. Before we start communicating, I want you to generate a set of missions for the student to follow, things that the student have to talk to you, and when the student complete those mission I want you to give them feedback, improvements. Remember to make it short, no longer than 50 words in each response. Please make the mission easier, since this is a level 1.Please generate the mission only one and after the student complete that one mission another will generate.`
            );
            break;
          case 2:
            setGeneratedText("");
            firstSend(
              `You are a teacher who pretends to be a barista from a cafe called 'Nakama'. Before we start communicating, I want you to generate a set of missions for the student to follow, things that the student have to talk to you, and when the student complete those mission I want you to give them feedback, improvements. Remember to make it short, no longer than 50 words in each response. Please make the mission a little hard, since this is a level 2. Please generate the mission only one and after the student complete that one mission another will generate.`
            );
            break;
          case 3:
            setGeneratedText("");
            firstSend(
              `You are a teacher who pretends to be a barista from a cafe called 'Nakama'. Before we start communicating, I want you to generate a set of missions for the student to follow, things that the student have to talk to you, and when the student complete those mission I want you to give them feedback, improvements. Remember to make it short, no longer than 50 words in each response. Please make the mission hard, since this is a level 3. Please generate the mission only one and after the student complete that one mission another will generate.`
            );
            break;
          default:
            break;
        }
      }
    } else if (selectedTheme === 2 && selectedItem === 1) {
      setGeneratedText("");
      setMessages([
        {
          message: `Hello! As a teacher from the University of Tokyo, I'm here to help and provide information. If you have any questions or need assistance with any educational or academic topics, please feel free to ask.`,
          sender: "user",
        },
      ]);
    } else if (selectedTheme === 3 && selectedItem === 1) {
      setGeneratedText("");
      firstSend(
        `Please generate a English sentence (atleast 10 words) for the user to practice their speaking. After users input their voice, please give advice and then generate another one. You check whether the user pronunciation is correct. If you think the accuracy of the user pronunciation exceeds 80%, you can just create another sentence for them to practice. Also, the advice should only about the words they have trouble pronoun with. So after a while, if the user pronunciation is great, tell them to move on to the next level.`
      );
    } else if (selectedTheme === 4 && selectedItem === 1) {
      setGeneratedText("");
      firstSend(
        `Please generate a English sentence (at least 30 words) for the user to practice their speaking. Make sure the level of the words a little harder to pronoun. After users input their voice, please give advice and then generate another one. You check whether the user pronunciation is correct. If you think the accuracy of the user pronunciation exceeds 80%, you can just create another sentence for them to practice. Also, the advice should only about the words they have trouble pronoun with. So after a while, if the user pronunciation is great, tell them to move on to the next level.`
      );
    } else if (selectedTheme === 5 && selectedItem === 1) {
      setGeneratedText("");
      firstSend(
        `Please generate a English sentence (at least 50 words) for the user to practice their speaking. Make sure the level of the words complicated to pronoun. After users input their voice, please give advice and then generate another one. You check whether the user pronunciation is correct. If you think the accuracy of the user pronunciation exceeds 80%, you can just create another sentence for them to practice. Also, the advice should only about the words they have trouble pronoun with. So after a while, if the user pronunciation is great, tell them to move on to the next level.`
      );
    }

    if (selectedItem === 0 && selectedTheme === 0) {
      setGeneratedText("");
      setMessages([
        {
          message: `こんにちは。何か相談したいことはありますか?`,
          sender: "user",
        },
      ]);
      // setSelectedTheme(0);
    } else if (selectedItem === 0 && selectedTheme === 1) {
      setGeneratedText("");
      setMessages([
        {
          message: `ちょっと、そこ！なかまカフェへようこそ。今日はどのようにお手伝いできますか?`,
          sender: "user",
        },
      ]);
      // setSelectedTheme(0);
    } else if (selectedItem === 0 && selectedTheme === 2) {
      setGeneratedText("");
      setMessages([
        {
          message: `「こんにちは！ 東京大学の教師として、私は情報を提供し、お手伝いするためにここにいます。教育上または学術上のトピックについてご質問やサポートが必要な場合は、お気軽にお問い合わせください。」,`,
          sender: "user",
        },
      ]);
    } else if (selectedItem === 0 && selectedTheme === 3) {
      setGeneratedText("");
      firstSend(
        `ユーザーがスピーキングを練習できるように、日本語の文章 (少なくとも 10 単語) を生成してください。ユーザーが声を入力したら、アドバイスを与えてから、別のアドバイスを生成してください。ユーザーの発音が正しいかどうかをチェックします。必ず日本語でのみ応答してください`
      );
    } else if (selectedItem === 0 && selectedTheme === 4) {
      setGeneratedText("");
      firstSend(
        `「ユーザーがスピーキングの練習をするために、日本語の文（少なくとも 30 単語）を生成してください。単語のレベルは発音が少し難しいようにしてください。ユーザーが音声を入力した後、アドバイスを与えてから、別の文を生成してください。チェックを入れます。」ユーザーの発音が正しいかどうか。」`
      );
    } else if (selectedItem === 0 && selectedTheme === 5) {
      setGeneratedText("");
      firstSend(
        `「ユーザーのスピーキング練習に役立つ日本語の文, 50 語以上 を生成します。単語に複雑な発音があることを確認してください。ユーザーが音声を入力した後にアドバイスを与えます。フィードバックを提供したら、ユーザーが練習できるように別の複雑な文を生成します。 。」`
      );
    }
  }, [selectedTheme, selectedItem, selectedLevel]);

  useEffect(() => {
    if (isDialogOpen && messages.length > 0) {
      const fetchEvaluatedConversation = async () => {
        const evaluation = await evaluateConversation(messages);
        setEvaluatedConversation(evaluation);
      };

      fetchEvaluatedConversation();
    }
  }, [isDialogOpen, messages]); // ✅ Runs every time isDialogOpen changes

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
      content: message + language,
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

  // This use AWS Transcribe, but doesn't include the duration selector
  // function SpeechToText(props) {
  //   const [response, setResponse] = useState();

  //   function AudioRecorder(props) {
  //     const [recording, setRecording] = useState(false);
  //     const [micStream, setMicStream] = useState();
  //     const [audioBuffer] = useState(
  //       (function () {
  //         let buffer = [];
  //         function add(raw) {
  //           buffer = buffer.concat(...raw);
  //           return buffer;
  //         }
  //         function newBuffer() {
  //           console.log("resetting buffer");
  //           buffer = [];
  //         }

  //         return {
  //           reset: function () {
  //             newBuffer();
  //           },
  //           addData: function (raw) {
  //             return add(raw);
  //           },
  //           getData: function () {
  //             return buffer;
  //           },
  //         };
  //       })()
  //     );

  //     async function startRecording() {
  //       console.log("start recording");
  //       audioBuffer.reset();
  //       window.navigator.mediaDevices
  //         .getUserMedia({ video: false, audio: true })
  //         .then((stream) => {
  //           const startMic = new mic();

  //           startMic.setStream(stream);
  //           startMic.on("data", (chunk) => {
  //             var raw = mic.toRaw(chunk);
  //             if (raw == null) {
  //               return;
  //             }
  //             audioBuffer.addData(raw);
  //           });

  //           setRecording(true);
  //           setMicStream(startMic);
  //         });
  //     }

  //     async function stopRecording() {
  //       console.log("stop recording");
  //       const { finishRecording } = props;

  //       micStream.stop();
  //       setMicStream(null);
  //       setRecording(false);

  //       const resultBuffer = audioBuffer.getData();

  //       if (typeof finishRecording === "function") {
  //         finishRecording(resultBuffer);
  //       }
  //     }

  //     return (
  //       <div className="audioRecorder">
  //         <div className="audioButton">
  //           {recording ? (
  //             <button onClick={stopRecording} title="Stop Recording">
  //               <FontAwesomeIcon icon={faSpinner} spin />{" "}
  //               {/* Show the spinning icon while processing */}
  //             </button>
  //           ) : (
  //             <button onClick={startRecording} title="Start Recording">
  //               <FontAwesomeIcon icon={faMicrophone} />{" "}
  //               {/* Show the microphone icon when not recording */}
  //             </button>
  //           )}
  //         </div>
  //       </div>
  //     );
  //   }

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
  //             console.log(selectedItem);
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

  // This use AWS Transcribe, and have the duration selections available
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

      useHotkeys("ctrl+k", () => {
        startRecording();
      });
      useHotkeys("ctrl+l", () => {
        stopRecording();
      });

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

  // This use whisper AI, although it is still not working properly
  // function SpeechToText(props) {
  //   const [response, setResponse] = useState();
  //   const [convertProcess, setConvertProcess] = useState(false);
  //   const [selectedItem, setSelectedItem] = useState(1); // Assuming 1 for "en-US"

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

  //       // Log a portion of the audio data for debugging
  //       console.log("Captured audio data:", resultBuffer.slice(0, 100));

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

  //   async function convertFromBuffer(bytes) {
  //     setResponse("Converting text...");
  //     setConvertProcess(true);

  //     try {
  //       // Log the length and a portion of the bytes array for inspection
  //       console.log("Audio bytes length:", bytes.length);
  //       console.log("Audio bytes sample:", bytes.slice(0, 20));

  //       // Validate that the audio data is not all zeros
  //       const isValidData = bytes.some((byte) => byte !== 0);
  //       if (!isValidData) {
  //         throw new Error("Recorded audio data is invalid (all zeros).");
  //       }

  //       // Create a valid WAV file header
  //       const header = createWavHeader(bytes.length, 44100, 1, 16);
  //       const wavData = new Uint8Array(header.length + bytes.length);
  //       wavData.set(header, 0);
  //       wavData.set(bytes, header.length);

  //       // Convert the combined array to a Blob
  //       const blob = new Blob([wavData], { type: "audio/wav" });

  //       // Create a File object from the Blob
  //       const audiofile = new File([blob], "audiofile.wav", {
  //         type: "audio/wav",
  //       });

  //       // Optional: Save the blob to verify its content
  //       const url = URL.createObjectURL(blob);
  //       console.log("Audio file URL:", url);
  //       // window.open(url); // Uncomment to open the audio file in a new tab

  //       const formData = new FormData();
  //       formData.append("file", audiofile);
  //       formData.append("model", "whisper-1");
  //       formData.append("response_format", "text");

  //       // Send the audio file to the transcription API
  //       const transcriptionResponse = await axios.post(
  //         "https://api.openai.com/v1/audio/transcriptions",
  //         formData,
  //         {
  //           headers: {
  //             Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`,
  //             "Content-Type": "multipart/form-data",
  //           },
  //           maxBodyLength: 10000,
  //           maxContentLength: 10000,
  //         }
  //       );

  //       // Log the entire response to understand its structure
  //       console.log("Full response:", transcriptionResponse);

  //       // Attempt to access the transcribed text
  //       const transcribedText = transcriptionResponse.data; // Access the plain text response directly
  //       console.log(`>> You said: ${transcribedText}`);

  //       // Set the response
  //       setResponse(transcribedText);
  //     } catch (error) {
  //       console.error(
  //         "Error during transcription:",
  //         error.response ? error.response.data : error.message
  //       );
  //       setResponse("Error during transcription");
  //     } finally {
  //       setConvertProcess(false);
  //     }
  //   }

  //   // Function to create a WAV file header
  //   function createWavHeader(dataSize, sampleRate, numChannels, bitsPerSample) {
  //     const header = new ArrayBuffer(44);
  //     const view = new DataView(header);

  //     /* RIFF identifier */
  //     view.setUint32(0, 0x52494646, false); // "RIFF"
  //     /* file length minus RIFF identifier length and file description length */
  //     view.setUint32(4, 36 + dataSize, true);
  //     /* RIFF type */
  //     view.setUint32(8, 0x57415645, false); // "WAVE"
  //     /* format chunk identifier */
  //     view.setUint32(12, 0x666d7420, false); // "fmt "
  //     /* format chunk length */
  //     view.setUint32(16, 16, true);
  //     /* sample format (raw) */
  //     view.setUint16(20, 1, true);
  //     /* channel count */
  //     view.setUint16(22, numChannels, true);
  //     /* sample rate */
  //     view.setUint32(24, sampleRate, true);
  //     /* byte rate (sample rate * block align) */
  //     view.setUint32(28, (sampleRate * numChannels * bitsPerSample) / 8, true);
  //     /* block align (channel count * bytes per sample) */
  //     view.setUint16(32, (numChannels * bitsPerSample) / 8, true);
  //     /* bits per sample */
  //     view.setUint16(34, bitsPerSample, true);
  //     /* data chunk identifier */
  //     view.setUint32(36, 0x64617461, false); // "data"
  //     /* data chunk length */
  //     view.setUint32(40, dataSize, true);

  //     return new Uint8Array(header);
  //   }

  //   return (
  //     <div className="Text">
  //       <div>
  //         <AudioRecorder finishRecording={convertFromBuffer} />
  //       </div>
  //       {convertProcess && <div>Converting...</div>}
  //       {response && <div>{response}</div>}
  //     </div>
  //   );
  // }

  function TextToSpeech({ generatedText }) {
    const [response, setResponse] = useState("...");

    const [isOpen, setOpen] = useState(false);
    const [items, setItem] = useState(data);
    const toggleDropdown = () => setOpen(!isOpen);
    let AudioContext = window.AudioContext || window.webkitAudioContext;
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
      if (source) {
        source.stop(0);
      }
    }

    useHotkeys("ctrl+m", () => {
      toggleTextToSpeech();
    });
    useHotkeys("ctrl+e", () => {
      source.stop(0);
    });

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

        if (source) {
          source.stop(0);
        }
        const audioCtx = new AudioContext();
        const audioSource = audioCtx.createBufferSource();

        audioCtx.decodeAudioData(
          arrayBuffer,
          (buffer) => {
            startMouthAnimation();
            audioSource.buffer = buffer;
            audioSource.connect(audioCtx.destination);
            audioSource.start(0);
            audioSource.addEventListener("ended", () => {
              stopMouthAnimation();
            });
          },
          (err) => {
            stopMouthAnimation();
          }
        );

        setSource(audioSource);
      } catch (error) {
        // Handle errors from the API or the audio processing
        console.error(`Error: ${error.message}`);
      } finally {
        stopMouthAnimation();
      }
    }

    // useEffect(() => {
    //   if (!textToSpeechEnabled && audioCtx) {
    //     audioCtx.close();
    //     setSource(null);
    //   }
    // }, [textToSpeechEnabled]);

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
        "You are a teacher who pretends to be a barista from a cafe called 'Nakama'. Before we start communicating, I want you to generate a set of missions for the student to follow, things that the student have to talk to you,  and when the student complete those mission I want you to give them feedback, improvements. Remember to make it short, no longer than 50 words in each response.";
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
      content: content + language,
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
    let accumulatedData = ""; // Accumulate data chunks

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      // Massage and parse the chunk of data
      // Decode and accumulate the chunk of data
      const chunk = decoder.decode(value, { stream: true });
      accumulatedData += chunk;

      // Split the accumulated data into lines
      const lines = accumulatedData.split("\n");
      accumulatedData = lines.pop(); // Keep the last incomplete line

      const parsedLines = [];
      for (const line of lines) {
        const trimmedLine = line.replace(/^data: /, "").trim();
        if (trimmedLine === "" || trimmedLine === "[DONE]") {
          continue;
        }

        try {
          const parsedLine = JSON.parse(trimmedLine);
          parsedLines.push(parsedLine);
        } catch (error) {
          console.error("Failed to parse line:", line, error);
          accumulatedData += line + "\n"; // Re-add the line to accumulated data
          break; // Exit the loop, wait for the next chunk
        }
      }

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

  async function evaluateConversation(chatMessage) {
    const apiMessages = chatMessage.map((messageObject) => ({
      role: messageObject.sender === "ChatGPT" ? "assistant" : "user",
      content: messageObject.message,
    }));

    const systemMessage = {
      role: "system",
      content:
        "You are an AI conversation evaluator. The student practices their speaking using audio in English. Since the audio is not available, analyze the text for clarity, engagement, coherence, and effectiveness. Provide specific feedback on what should be improved, what was done well, and how the user can have a better interaction with the AI. Keep your response concise, within 100 words.",
    };

    const apiRequestBody = {
      model: "gpt-4o",
      messages: [systemMessage, ...apiMessages],
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

    const data = await res.json();
    const evaluationEnglish = data.choices[0].message.content;

    // 🔹 Translate to Japanese
    const translationRequest = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Translate the following text into Japanese.",
        },
        { role: "user", content: evaluationEnglish },
      ],
      max_tokens: 200,
    };

    const translationRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(translationRequest),
      }
    );

    const translationData = await translationRes.json();
    const evaluationJapanese = translationData.choices[0].message.content;

    return { english: evaluationEnglish, japanese: evaluationJapanese };
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
    if (id === 1) {
      setShowLevel(true);
    } else {
      setShowLevel(false);
    }
    if (source) {
      source.stop(0);
    }
  };
  const levelOptions = ["Level 1", "Level 2", "Level 3"];

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

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEvaluatedConversation(""); // ✅ Reset when closing
  };

  const handleConfirmDialog = () => {
    setDialogOpen(false);
    console.log("CSV Generated!"); // Replace this with your CSV generation logic
    generateCsv();
  };

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
  const handleLevelSelect = (level) => {
    setSelectedLevel(level);
    console.log(level);
  };

  return (
    <>
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
                  {showLevel && (
                    <div className="level-dropdown">
                      <p>Please choose a level:</p>
                      {levelOptions.map((level, index) => (
                        <div
                          key={index}
                          className={`level-item ${
                            selectedLevel === index + 1 ? "selected" : ""
                          }`}
                          onClick={() => handleLevelSelect(index + 1)}
                        >
                          {level}
                        </div>
                      ))}
                    </div>
                  )}
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

            <div className="languageSelector">
              <p className="languageTitle">Response: </p>

              <CustomRadioButton
                label="English"
                selected={selectedValue === "english"}
                onSelect={() => setSelectedValue("english")}
              />
              <CustomRadioButton
                label="Japanese"
                selected={selectedValue === "japanese"}
                onSelect={() => setSelectedValue("japanese")}
              />
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
                      // autoFocus
                      onAttachClick={() => handleOpenDialog()}
                      attachButton={true}
                    ></MessageInput>
                  </div>
                </ChatContainer>
              </MainContainer>
            </div>
          </div>
        </div>
      </div>
      <div>
        <CSVDialog
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          messages={messages} // Pass messages as a prop
          evaluatedConversation={evaluatedConversation}
        />
        <Modal isOpen={open} onClose={handleClose} className="modal-container">
          <>
            <h3 style={{ marginBottom: "10px" }}>Keyboard Shortcuts</h3>
            <ul style={{ paddingLeft: "20px" }}>
              <li>
                <strong>Ctrl + E</strong> to stop the audio
              </li>
              <li>
                <strong>Ctrl + M</strong> to mute the audio
              </li>
              <li>
                <strong>Ctrl + K</strong> to start the recording
              </li>
              <li>
                <strong>Ctrl + L</strong> to stop the recording
              </li>
            </ul>
          </>
        </Modal>
      </div>
    </>
  );
}

export default App;
