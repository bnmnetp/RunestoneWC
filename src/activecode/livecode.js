import { ActiveCode } from "./activecode.js";

export default class LiveCode extends ActiveCode {
  constructor(opts) {
    super();
    if (opts) {
      this.init(opts);
    }
  }
  init(opts) {
    ActiveCode.prototype.init.apply(this, arguments);
    var orig = opts.orig;
    this.stdin = $(orig).data("stdin");
    this.datafile = $(orig).data("datafile");
    this.sourcefile = $(orig).data("sourcefile");
    this.compileargs = unescapeHtml($(orig).data("compileargs"));
    this.linkargs = unescapeHtml($(orig).data("linkargs"));
    this.runargs = unescapeHtml($(orig).data("runargs"));
    this.interpreterargs = unescapeHtml($(orig).data("interpreterargs"));
    this.API_KEY = "67033pV7eUUvqo07OJDIV8UZ049aLEK1";
    this.USE_API_KEY = true;
    this.JOBE_SERVER = eBookConfig.jobehost || eBookConfig.host;
    this.resource = eBookConfig.proxyuri_runs || "/runestone/proxy/jobeRun";
    this.jobePutFiles =
      eBookConfig.proxyuri_files || "/runestone/proxy/jobePushFile/";
    this.jobeCheckFiles =
      eBookConfig.proxyuri_files || "/runestone/proxy/jobeCheckFile/";
    // TODO:  should add a proper put/check in pavement.tmpl as this is misleading and will break on runestone
    this.div2id = {};
    if (this.stdin) {
      this.createInputElement();
    }
    this.createErrorOutput();
  }
  outputfun(a) {}
  createInputElement() {
    var label = document.createElement("label");
    label.for = this.divid + "_stdin";
    $(label).text($.i18n("msg_activecode_input_prg"));
    var input = document.createElement("input");
    input.id = this.divid + "_stdin";
    input.type = "text";
    input.size = "35";
    input.value = this.stdin;
    this.outerDiv.appendChild(label);
    this.outerDiv.appendChild(input);
    this.stdin_el = input;
  }
  createErrorOutput() {}
  /**
   * Note:
   * In order to check for supplemental files in java and deal with asynchronicity
   * I split the original runProg into two functions: runProg and runProg_callback
   */
  runProg() {
    var stdin;
    var scrubber_dfd, history_dfd;
    var saveCode = "True";
    var sfilemap = {
      java: "",
      cpp: "test.cpp",
      c: "test.c",
      python3: "test.py",
      python2: "test.py"
    };
    var source = this.editor.getValue();
    source = this.buildProg(true);
    var __ret = this.manage_scrubber(scrubber_dfd, history_dfd, saveCode);
    history_dfd = __ret.history_dfd;
    saveCode = __ret.saveCode;
    var paramlist = ["compileargs", "linkargs", "runargs", "interpreterargs"];
    var paramobj = {};
    for (param of paramlist) {
      if (this[param]) {
        paramobj[param] = eval(this[param]); // needs a list
      }
    }
    if (this.stdin) {
      stdin = $(this.stdin_el).val();
    }
    if (!this.sourcefile) {
      this.sourcefile = sfilemap[this.language];
    }
    $(this.output).html($.i18n("msg_activecode_compiling_running"));
    var files = [];
    if (this.datafile != undefined) {
      var ids = this.datafile.split(",");
      for (var i = 0; i < ids.length; i++) {
        file = document.getElementById(ids[i].trim());
        if (file === null || file === undefined) {
          // console.log("No file with given id");
        } else if (file.className === "javaFiles") {
          files = files.concat(this.parseJavaClasses(file.textContent));
        } else if (file.className === "image") {
          var fileName = file.id;
          var extension = fileName.substring(fileName.indexOf(".") + 1);
          var base64 = file.toDataURL("image/" + extension);
          base64 = base64.substring(base64.indexOf(",") + 1);
          files.push({ name: fileName, content: base64 });
        } else {
          // if no className or un recognized className it is treated as an individual file
          // this could be any type of file, .txt, .java, .csv, etc
          files.push({ name: file.id, content: file.textContent });
        }
      }
    }
    runspec = {
      language_id: this.language,
      sourcecode: source,
      parameters: paramobj,
      sourcefilename: this.sourcefile
    };
    if (stdin) {
      runspec.input = stdin;
    }
    if (files.length === 0) {
      data = JSON.stringify({ run_spec: runspec });
      this.runProg_callback(data);
    } else {
      runspec["file_list"] = [];
      var promises = [];
      var instance = this;
      //todo: Not sure why this is loaded like this. It could be loaded once.
      $.getScript(
        "https://cdn.rawgit.com/killmenot/webtoolkit.md5/master/md5.js",
        function() {
          for (var i = 0; i < files.length; i++) {
            var fileName = files[i].name;
            var fileContent = files[i].content;
            instance.div2id[fileName] =
              "runestone" + MD5(fileName + fileContent);
            runspec["file_list"].push([instance.div2id[fileName], fileName]);
            promises.push(
              new Promise((resolve, reject) => {
                instance.checkFile(files[i], resolve, reject);
              })
            );
          }
          data = JSON.stringify({ run_spec: runspec });
          this.div2id = instance.div2id;
          Promise.all(promises)
            .then(function() {
              // console.log("All files on Server");
              instance.runProg_callback(data);
            })
            .catch(function(err) {
              // console.log("Error: " + err);
            });
        }
      );
    }
  }
  runProg_callback(data) {
    var xhr, stdin;
    var runspec = {};
    var scrubber_dfd, history_dfd;
    var host, source, editor;
    var saveCode = "True";
    var sfilemap = {
      java: "",
      cpp: "test.cpp",
      c: "test.c",
      python3: "test.py",
      python2: "test.py"
    };
    source = this.editor.getValue();
    xhr = new XMLHttpRequest();
    host = this.JOBE_SERVER + this.resource;
    var odiv = this.output;
    $(this.runButton).attr("disabled", "disabled");
    $(this.outDiv).show({ duration: 700, queue: false });
    $(this.errDiv).remove();
    $(this.output).css("visibility", "visible");
    xhr.open("POST", host, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("X-API-KEY", this.API_KEY);
    xhr.onload = function() {
      var logresult;
      $(this.runButton).removeAttr("disabled");
      try {
        var result = JSON.parse(xhr.responseText);
      } catch (e) {
        result = {};
        result.outcome = -1;
      }
      if (result.outcome === 15) {
        logresult = "success";
      } else {
        logresult = result.outcome;
      }
      this.logRunEvent({
        div_id: this.divid,
        code: source,
        errinfo: logresult,
        to_save: saveCode,
        lang: this.language,
        event: "livecode",
        partner: this.partner
      });
      switch (result.outcome) {
        case 15:
          $(odiv).html(result.stdout.replace(/\n/g, "<br>"));
          break;
        case 11: // compiler error
          $(odiv).html($.i18n("msg_activecode_were_compiling_err"));
          this.addJobeErrorMessage(result.cmpinfo);
          break;
        case 12: // run time error
          $(odiv).html(result.stdout.replace(/\n/g, "<br>"));
          if (result.stderr) {
            this.addJobeErrorMessage(result.stderr);
          }
          break;
        case 13: // time limit
          $(odiv).html(result.stdout.replace(/\n/g, "<br>"));
          this.addJobeErrorMessage($.i18n("msg_activecode_time_limit_exc"));
          break;
        default:
          if (result.stderr) {
            $(odiv).html(result.stderr.replace(/\n/g, "<br>"));
          } else {
            this.addJobeErrorMessage(
              $.i18n("msg_activecode_server_err", xhr.status, xhr.statusText)
            );
          }
      }
      // todo: handle server busy and timeout errors too
    }.bind(this);
    ///$("#" + divid + "_errinfo").remove();
    xhr.onerror = function() {
      this.addJobeErrorMessage($.i18n("msg_activecode_server_comm_err"));
      $(this.runButton).removeAttr("disabled");
    }.bind(this);
    xhr.send(data);
  }
  addJobeErrorMessage(err) {
    var errHead = $("<h3>").html("Error");
    var eContainer = this.outerDiv.appendChild(document.createElement("div"));
    this.errDiv = eContainer;
    eContainer.className = "error alert alert-danger";
    eContainer.id = this.divid + "_errinfo";
    eContainer.appendChild(errHead[0]);
    var errText = eContainer.appendChild(document.createElement("pre"));
    errText.innerHTML = err;
  }
  /**
   * Checks to see if file is on server
   * Places it on server if it is not on server
   * @param  {object{name, contents}} file    File to place on server
   * @param  {function} resolve promise resolve function
   * @param  {function} reject  promise reject function
   */
  checkFile(file, resolve, reject) {
    var file_id = this.div2id[file.name];
    var resource = this.jobeCheckFiles + file_id;
    var host = this.JOBE_SERVER + resource;
    var xhr = new XMLHttpRequest();
    xhr.open("HEAD", host, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.setRequestHeader("Accept", "text/plain");
    xhr.setRequestHeader("X-API-KEY", this.API_KEY);
    xhr.onerror = function() {
      // console.log("error sending file" + xhr.responseText);
    };
    xhr.onload = function() {
      switch (xhr.status) {
        case 208:
        case 404:
          // console.log("File not on Server");
          this.pushDataFile(file, resolve, reject);
          break;
        case 400:
          // console.log("Bad Request");
          reject();
          break;
        case 204:
          // console.log("File already on Server");
          resolve();
          break;
        default:
          //console.log("This case should never happen");
          reject();
      }
    }.bind(this);
    xhr.send();
  }
  /**
   * Places a file on a server
   */
  pushDataFile(file, resolve, reject) {
    var fileName = file.name;
    var extension = fileName.substring(fileName.indexOf(".") + 1);
    var file_id = this.div2id[fileName];
    var contents = file.content;
    // File types being uploaded that come in already in base64 format
    var extensions = ["jar", "zip", "png", "jpg", "jpeg"];
    var contentsb64;
    if (extensions.indexOf(extension) === -1) {
      contentsb64 = btoa(contents);
    } else {
      contentsb64 = contents;
    }
    var data = JSON.stringify({ file_contents: contentsb64 });
    var resource = this.jobePutFiles + file_id;
    var host = this.JOBE_SERVER + resource;
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", host, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.setRequestHeader("Accept", "text/plain");
    xhr.setRequestHeader("X-API-KEY", this.API_KEY);
    xhr.onload = function() {
      switch (xhr.status) {
        case 403:
          // console.log("Forbidden");
          reject();
          break;
        case 400:
          // console.log("Bad Request");
          reject();
          break;
        case 204:
          //console.log("successfully sent file " + xhr.responseText);
          //console.log("File " + fileName +", " + file_id +" placed on server");
          resolve();
          break;
        default:
          // console.log("This case should never happen");
          reject();
      }
    }.bind(this);
    xhr.onerror = function() {
      // console.log("error sending file" + xhr.responseText);
      reject();
    };
    xhr.send(data);
  }
  /**
   * Seperates text into multiple .java files
   * @param  {String} text String with muliple java classes needed to be seperated
   * @return {array of objects}  .name gives the name of the java file with .java extension
   *                   .content gives the contents of the file
   */
  parseJavaClasses(text) {
    text = text.trim();
    var found = false;
    var stack = 0;
    var startIndex = 0;
    var classes = [];
    var importIndex = 0;
    var endOfLastCommentBeforeClassBegins = 0;
    for (var i = 0; i < text.length; i++) {
      var char = text.charAt(i);
      if (char === "/") {
        i++;
        if (text.charAt(i) === "/") {
          i++;
          while (text.charAt(i) !== "\n" && i < text.length) {
            i++;
          }
          if (!found) {
            endOfLastCommentBeforeClassBegins = i;
          }
        } else if (text.charAt(i) == "*") {
          i++;
          while (
            (text.charAt(i) !== "*" || text.charAt(i + 1) !== "/") &&
            i + 1 < text.length
          ) {
            i++;
          }
          if (!found) {
            endOfLastCommentBeforeClassBegins = i;
          }
        }
      } else if (char === '"') {
        i++;
        while (text.charAt(i) !== '"' && i < text.length) {
          i++;
        }
      } else if (char === "'") {
        while (text.charAt(i) !== "'" && i < text.length) {
          i++;
        }
      } else if (char === "(") {
        var pCount = 1;
        i++;
        while (pCount > 0 && i < text.length) {
          if (text.charAt(i) === "(") {
            pCount++;
          } else if (text.charAt(i) === ")") {
            pCount--;
          }
          i++;
        }
      }
      if (!found && text.charAt(i) === "{") {
        startIndex = i;
        found = true;
        stack = 1;
      } else if (found) {
        if (text.charAt(i) === "{") {
          stack++;
        }
        if (text.charAt(i) === "}") {
          stack--;
        }
      }
      if (found && stack === 0) {
        endIndex = i + 1;
        var words = text
          .substring(endOfLastCommentBeforeClassBegins, startIndex)
          .trim()
          .split(" ");
        var className = "";
        for (var w = 0; w < words.length; w++) {
          className = words[w];
          if (words[w] === "extends" || words[w] === "implements") {
            className = words[w - 1];
            w = words.length;
          }
        }
        className = className.trim() + ".java";
        classes.push({
          name: className,
          content: text.substring(importIndex, endIndex)
        });
        found = false;
        importIndex = endIndex;
        endOfLastCommentBeforeClassBegins = endIndex;
      }
    }
    return classes;
  }
}
function unescapeHtml(safe) {
  if (safe) {
    return safe
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'");
  }
}
