import React from "react";
import ReactDOM from "react-dom";
import "./errorPage.css";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// Amplify.configure(awsExports);
const timeStart = "18:00:00";
const timeEnd = "19:00:00";
const allowedStart = new Date(`2024-09-05T${timeStart}`);
const allowedEnd = new Date(`2024-09-05T${timeEnd}`);
const currentTime = new Date();

const isWithinAllowedTime = (current, start, end) => {
  return current >= start && current <= end;
};

const Star = () => {
  // Generate random sizes, positions, and animation delays
  const size = Math.random() * 3 + 1 + "px"; // Size between 1px and 4px
  const left = Math.random() * 100 + "%"; // Position between 0% and 100%
  const top = Math.random() * 100 + "%"; // Position between 0% and 100%

  return (
    <div
      className="star"
      style={{
        width: size,
        height: size,
        left: left,
        top: top,
        animation: `twinkle1 ${Math.random() * 5 + 5}s linear infinite`,
      }}
    ></div>
  );
};
const Stars = () => {
  const starElements = [];
  for (let i = 0; i < 200; i++) {
    // Increased the number of stars
    starElements.push(<Star key={i} index={i} />);
  }
  return <div className="stars">{starElements}</div>;
};

const ErrorPage = () => (
  <div className="wrapper">
    <div className="text_group">
      <p className="text_404">Access Restricted</p>
      <p className="text_lost">
        Access to this application is only <br />
        allowed between {timeStart.slice(0, 5)} and {timeEnd.slice(0, 5)}
      </p>
    </div>
    <div className="window_group">
      <div className="window_404">
        <Stars />
      </div>
    </div>
  </div>
);

ReactDOM.render(
  <React.StrictMode>
    {/* {isWithinAllowedTime(currentTime, allowedStart, allowedEnd) ? (
      <App />
    ) : (
      <ErrorPage />
    )} */}
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
