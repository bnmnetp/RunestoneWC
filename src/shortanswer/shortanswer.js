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
      var orig = opts.orig; // entire <p> element that will be replaced by new HTML
      this.useRunestoneServices =
        opts.useRunestoneServices || eBookConfig.useRunestoneServices;
    }
    //      this.origElem = orig;
    //      this.divid = orig.id;
    //      this.question = this.origElem.innerHTML;
    this.optional = false;
    if ($(this.origElem).is("[data-optional]")) {
      this.optional = true;
    }
    //this.renderHTML();
    this.shadow = this.attachShadow({ mode: "open" });
    this.shadow.appendChild(templateEl.content.cloneNode(true));

    this.caption = "shortanswer";
    //this.addCaption("runestone");
  }

  connectedCallback() {
    // connect the save button
    this.checkServer("shortanswer");
    this.divid = this.getAttribute("id");
  }

  submitJournal() {
    var value = $("#" + this.divid + "_solution").val();
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
        let solution = $("#" + this.divid + "_solution");
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

window.customElements.define("runestone-shortanswer", ShortAnswer);
