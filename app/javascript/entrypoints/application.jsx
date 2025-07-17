// To see this message, add the following to the `<head>` section in your
// views/layouts/application.html.erb
//
//    <%= vite_client_tag %>
//    <%= vite_javascript_tag 'application' %>
console.log('Vite ⚡️ Rails')

// import * as Turbo from '@hotwired/turbo'
// Turbo.start()
// import ActiveStorage from '@rails/activestorage'
// ActiveStorage.start()

// Example: Import a stylesheet in app/frontend/index.css
// import '~/index.css'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "../components/App";
import "../stylesheets/application.css";
import { inherits } from 'util';

// Expose util.inherits for libraries expecting the Node util module
if (typeof window !== 'undefined') {
  window.util = { inherits };
}


const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
