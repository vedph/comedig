// List of the XML files to be processed.
const XMLFiles = [
  "/teatro700/xml/arlekin_i_smeraldina_ljubovniki.xml",
  "/teatro700/xml/Smeraldinaspritofolletto_IT-1.xml",
  "/teatro700/xml/esempio_corpus.xml",
  "/teatro700/xml/Il_Francese_a_Venezia_CORPUS.xml"
];

var CETEIcean;

const Teatro700 = {
  works: [],

  // everything starts here, with the processing of the XML files.
  async init() {
    for (let xmlFile of XMLFiles) {
      await this.processXmlFile(xmlFile);
    }

    this.populateMenu();

    this.maybeShowWork();
  },

  // Here it processes a single XML file.
  async processXmlFile(xmlFile) {
    const response = await fetch(xmlFile);
    const xmlData = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlData, "text/xml");

    this.processDoc(doc);
  },

  //a query xpath is executed using a TEI ns
  runXPath(xmlDoc, xpath, node) {
    return xmlDoc.evaluate(xpath, node, ns => {
          if (ns == "tei") return "http://www.tei-c.org/ns/1.0";
    });
  },
  //Extract work and castlist elements from a XML doc
  processDoc(xmlDoc) {
    const work = {
      xmlDoc,
      title: "",
      versions: [],
      // TODO characters: [],
    };

    try {
      work.title = this.runXPath(xmlDoc, "/tei:teiCorpus/tei:teiHeader//tei:title", xmlDoc).iterateNext().textContent;
    } catch (e) {
      console.error("No teiCorpus found!");
      return;
    }

    const teiResult = this.runXPath(xmlDoc, "/tei:teiCorpus/tei:TEI", xmlDoc);
    for (let a = teiResult.iterateNext(); a; a = teiResult.iterateNext()) {
      work.versions.push(a);
    }

    /* TODO
    const castListResult = this.runXPath(xmlDoc, "/tei:TEI//tei:castList/tei:castItem", xmlDoc);
    for (let a = castListResult.iterateNext(); a; a = castListResult.iterateNext()) {
      const name = this.runXPath(xmlDoc, "./tei:role", a).iterateNext().textContent;

      let description = "";
      try {
        description = this.runXPath(xmlDoc, "./tei:roleDesc", a).iterateNext().textContent;
      } catch(e) {}

      work.characters.push({
        name,
        description,
      });
    }

    const castGroupResult = this.runXPath(xmlDoc, "/tei:TEI//tei:castList/tei:castGroup", xmlDoc);
    for (let a = castGroupResult.iterateNext(); a; a = castGroupResult.iterateNext()) {
      let description = "";
      try {
        description = this.runXPath(xmlDoc, "./tei:roleDesc", a).iterateNext().textContent;
      } catch(e) {}

      const castListResult = this.runXPath(xmlDoc, "./tei:castItem", a);
      for (let a = castListResult.iterateNext(); a; a = castListResult.iterateNext()) {
        const name = this.runXPath(xmlDoc, "./tei:role", a).iterateNext().textContent;
        work.characters.push({name, description });
      }
    }
    */

    this.works.push(work);
  },

  // Let's populate the menu with the list of works.
  populateMenu() {
    const elm = document.getElementById("menuWorks");
    for (let workId in this.works) {
      const work = this.works[workId];

      const elmLi = document.createElement("li");
      const elmA = document.createElement("a");
      elmA.setAttribute("class", "dropdown-item");
      elmA.setAttribute("href", "/teatro700/work?id=" + workId);
      elmA.textContent = work.title;
      elmLi.appendChild(elmA);
      elm.appendChild(elmLi);
    }
  },

  maybeShowWork() {
    if (!location.pathname.startsWith("/teatro700/work")) {
      return;
    }

    const urlParam = new URLSearchParams(location.search);
    const workId = urlParam.get("id");
    const work = this.works[workId];

    document.getElementById("workTitle").textContent = work.title;

    const elmTabUl = document.getElementById("tab");
    const elmTabContentUl = document.getElementById("tabContent");

    for (let version of work.versions) {
      const language = this.runXPath(work.xmlDoc, ".//tei:language", version).iterateNext().textContent;

      const li = document.createElement("li");
      li.setAttribute("class", "nav-item");
      li.setAttribute("role", "presentation");

      const button = document.createElement("button");
      button.setAttribute("class", "nav-link");
      button.setAttribute("id", language + "-tab");
      button.setAttribute("data-bs-toggle", "tab");
      button.setAttribute("data-bs-target", "#" + language);
      button.setAttribute("type", "button");
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", language);
      button.setAttribute("aria-selected", "true");
      button.textContent = `Versione in ${language}`;
      li.appendChild(button);

      elmTabUl.appendChild(li);

      const div = document.createElement("div");
      div.setAttribute("class", "tab-pane fade show");
      div.setAttribute("id", language);
      div.setAttribute("role", "tabpanel");
      div.setAttribute("aria-labelledby", language + "-tab");

      elmTabContentUl.appendChild(div);

      if (!CETEIcean) {
        CETEIcean = new CETEI();
      }

      CETEIcean.domToHTML5(version, data => {
        document.getElementById(language).appendChild(data);
      });
    }
  }
};

Teatro700.init();
