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
      facsimiles: [],
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

      const language = this.runXPath(xmlDoc, ".//tei:language", a).iterateNext().textContent;
      const facsimileResult = this.runXPath(xmlDoc, ".//tei:facsimile//tei:graphic", a);
      const facsimile = { language, images: [] };
      for (let i = facsimileResult.iterateNext(); i; i = facsimileResult.iterateNext()) {
        facsimile.images.push("/teatro700" + i.getAttribute("url"));
      }
      work.facsimiles.push(facsimile);
    }

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

    const elmCompareA = document.getElementById("compareA");
    const elmCompareB = document.getElementById("compareB");

    const showBody = (value, body)  => {
      const elm = document.getElementById(body);
      while (elm.firstChild) elm.firstChild.remove();

      if (value.startsWith("version-")) {
        const versionId = parseInt(value.slice(8), 10);
        CETEIcean.domToHTML5(work.versions[versionId], data => {
          document.getElementById(body).appendChild(data);
        });
        return;
      }

      if (value.startsWith("facsimile-")) {
        const div = document.createElement("div");
        div.setAttribute("id", "openseadragon");
        div.setAttribute("style", "height: 600px;");
        elm.appendChild(div);

        const images = [];
        const facsimileId = parseInt(value.slice(10), 10);
        work.facsimiles[facsimileId].images.forEach(img => images.push({
          type: 'image',
          url:  img
        }));

        OpenSeadragon({
          id: "openseadragon",
          prefixUrl: "https://cdn.jsdelivr.net/npm/openseadragon@2.4/build/openseadragon/images/",
          tileSources: images,
          sequenceMode: true,
        });
        return;
      }
    }
    elmCompareA.onchange = e => showBody(e.target.value, "bodyA");
    elmCompareB.onchange = e => showBody(e.target.value, "bodyB");

    work.versions.forEach((version, pos) => {
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
        CETEIcean.addBehaviors({"tei":{
         "graphic": function(elt) {
           // No images
         }
        }});
      }

      CETEIcean.domToHTML5(version, data => {
        document.getElementById(language).appendChild(data);
      });

      for (let elm of [ elmCompareA, elmCompareB]) {
        const option = document.createElement("option");
        option.textContent = language;
        option.value = `version-${pos}`;
        elm.appendChild(option);
      }
    });

    work.facsimiles.forEach((facsimile, pos) => {
      for (let elm of [ elmCompareA, elmCompareB]) {
        if (facsimile.images.length > 0) {
          const option = document.createElement("option");
          option.textContent = `Facsimile ${facsimile.language}`;
          option.value = `facsimile-${pos}`;
          elm.appendChild(option);
        }
      }
    });

    showBody("version-0", "bodyA");
    showBody("version-0", "bodyB");
  }
};

Teatro700.init();
