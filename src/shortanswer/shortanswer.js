/*==========================================
=======    Master shortanswer.js    ========
============================================
===     This file contains the JS for    ===
=== the Runestone shortanswer component. ===
============================================
===              Created by              ===
===           Isaiah Mayerchak           ===
===                7/2/15                ===
===              Brad Miller             ===
===                2019                  ===
==========================================*/

import RunestoneBase from "../common/runestonebase.js";
import rstemplate from "./sa_template.html";

const templateEl = document.createElement("template");
templateEl.innerHTML = rstemplate;

var saList = {}; // Dictionary that contains all instances of shortanswer objects

export default class ShortAnswer extends RunestoneBase {
  constructor(opts) {
    super();
    if (opts) {
      var orig = opts.orig;
      this.useRunestoneServices =
        opts.useRunestoneServices || eBookConfig.useRunestoneServices;
    }
    this.optional = false;
    if ($(this.origElem).is("[data-optional]")) {
      this.optional = true;
    }
    //this.renderHTML();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(templateEl.content.cloneNode(true));
    this.saveButton = shadow.getElementById("sa_save");
    this.textArea = shadow.getElementById("question1_solution");
    this.feedbackDiv = shadow.getElementById("question1_feedback");
    this.caption = "shortanswer";
    //this.addCaption("runestone");
  }

  connectedCallback() {
    this.divid = this.getAttribute("id"); // this would be better in the constructor but we need to delay our registration until the end of the page

    this.checkServer("shortanswer");
    this.saveButton.addEventListener("click", this.submitJournal.bind(this));
  }

  submitJournal() {
    var value = this.textArea.value;
    this.setLocalStorage({
      answer: value,
      timestamp: new Date()
    });
    this.logBookEvent({
      event: "shortanswer",
      act: value,
      div_id: this.divid
    });
    this.feedbackDiv.innerHTML = "Your answer has been saved.";
    $(this.feedbackDiv).removeClass("alert-danger");
    $(this.feedbackDiv).addClass("alert alert-success");
  }

  setLocalStorage(data) {
    if (!this.graderactive) {
      let key = this.localStorageKey();
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  checkLocalStorage() {
    // Repopulates the short answer text
    // which was stored into local storage.
    if (this.graderactive) {
      return;
    }
    var len = localStorage.length;
    if (len > 0) {
      var ex = localStorage.getItem(this.localStorageKey());
      if (ex !== null) {
        try {
          var storedData = JSON.parse(ex);
          var answer = storedData.answer;
        } catch (err) {
          // error while parsing; likely due to bad value stored in storage
          console.log(err.message);
          localStorage.removeItem(this.localStorageKey());
          return;
        }
        let solution = $(this.textArea);
        solution.text(answer);
        this.feedbackDiv.innerHTML =
          "Your current saved answer is shown above.";
        $(this.feedbackDiv).removeClass("alert-danger");
        $(this.feedbackDiv).addClass("alert alert-success");
      }
    }
  }
  restoreAnswers(data) {
    // Restore answers from storage retrieval done in RunestoneBase
    // sometimes data.answer can be null
    if (!data.answer) {
      data.answer = "";
    }
    this.answer = data.answer;
    this.jTextArea.value = this.answer;
    this.feedbackDiv.innerHTML = "Your current saved answer is shown above.";
    $(this.feedbackDiv).removeClass("alert-danger");
    $(this.feedbackDiv).addClass("alert alert-success");
  }
}

/*=================================
== Find the custom HTML tags and ==
==   execute our code on them    ==
=================================*/

if (typeof component_factory === "undefined") {
  var component_factory = {};
}

component_factory.shortanswer = function(opts) {
  return new ShortAnswer(opts);
};

if (!window.customElements.get("runestone-shortanswer")) {
  window.customElements.define("runestone-shortanswer", ShortAnswer);
}
