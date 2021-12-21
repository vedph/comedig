// List of the XML files to be processed.
const XMLFiles = [
  "/comedig/xml/Il_Francese_a_Venezia_CORPUS.xml",
  "/comedig/xml/Il_dottore_da_due_volti_CORPUS.xml",
  "/comedig/xml/La_nascita_di_Arlecchino_1733.xml",
  "/comedig/xml/Le_fortunate_disgrazie_di_Arlecchino_CORPUS (RU_GE).xml",
  "/comedig/xml/Brighella_armi_e_bagagli_CORPUS.xml",
  "/comedig/xml/Gli_amanti_rivali_CORPUS.xml",
  "/comedig/xml/Il_dottore_da_due_volti_CORPUS.xml",
  "/comedig/xml/Il_Francese_a_Venezia_CORPUS.xml",
  "/comedig/xml/Il_grande_Basilisco_CORPUS_rivisto_TK.xml",
  "/comedig/xml/I_quattro_arlecchini_CORPUS.xml",
  "/comedig/xml/La_lavandaia_nobile_CORPUS.xml",
  "/comedig/xml/La_nascita_di_Arlecchino_1733.xml",
  "/comedig/xml/L_Arcadia_incantata_CORPUS.xml",
  "/comedig/xml/le_disgrazie_di_pantalone_e_arlecchino_finto_corriere_poi_anche_barbiere_alla_moda_CORPUS_(RU_GE).xml",
  "/comedig/xml/Le_fortunate_disgrazie_di_Arlecchino_CORPUS (RU_GE).xml",
  "/comedig/xml/le_magie_di_pietro_d_abano_e_smeraldina_regina_degli_spiriti_CORPUS_(RU_GE)__rivisto_TK.xml",
  "/comedig/xml/Lo_spergiuro_CORPUS_(RU_GE).xml",
  "/comedig/xml/Smeraldina_che_si_fa_odiare_CORPUS_TK.xml",
  "/comedig/xml/Smeraldina_spirito_folletto_CORPUS.xml"
];

var CETEIcean;

const Comedig = {
  works: [],
  agents: [],

  // everything starts here, with the processing of the XML files.
  async init() {
    for (let xmlFile of XMLFiles) {
      await this.processXmlFile(xmlFile);
    }

    await this.importPeople();

    this.populateMenu();

    this.maybeShowWork();
    this.maybeShowAgent();
  },

  // Here it processes a single XML file.
  async processXmlFile(xmlFile) {
    const response = await fetch(xmlFile);
    const xmlData = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlData, "text/xml");

    this.processDoc(xmlFile, doc);
  },

  //a query xpath is executed using a TEI ns
  runXPath(xmlDoc, xpath, node) {
    return xmlDoc.evaluate(xpath, node, ns => {
          if (ns == "tei") return "http://www.tei-c.org/ns/1.0";
    });
  },

  //Extract work and castlist elements from a XML doc
  processDoc(xmlFile, xmlDoc) {

    const work = {
      url: new URL(xmlFile, window.location),
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
        facsimile.images.push("/comedig" + i.getAttribute("url"));
      }
      work.facsimiles.push(facsimile);
    }

    this.works.push(work);
  },

  // Let's populate the menu with the list of works.
  populateMenu() {
    this.populateMenuWorks();
    this.populateMenuAgents();
  },

  populateMenuWorks() {
    const elm = document.getElementById("menuWorks");
    for (let workId in this.works) {
      const work = this.works[workId];

      const elmLi = document.createElement("li");
      const elmA = document.createElement("a");
      elmA.setAttribute("class", "dropdown-item");
      elmA.setAttribute("href", "/comedig/work?id=" + workId);
      elmA.textContent = work.title;
      elmLi.appendChild(elmA);
      elm.appendChild(elmLi);
    }
  },

  populateMenuAgents() {
    const elm = document.getElementById("menuAgents");
    for (let agentId in this.agents) {
      const agent = this.agents[agentId];

      const elmLi = document.createElement("li");
      const elmA = document.createElement("a");
      elmA.setAttribute("class", "dropdown-item");
      elmA.setAttribute("href", "/comedig/agent?id=" + agentId);
      elmA.textContent = agent.name;
      elmLi.appendChild(elmA);
      elm.appendChild(elmLi);
    }
  },

  maybeShowWork() {
    if (!location.pathname.startsWith("/comedig/work")) {
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

    const agentWorkList = document.getElementById("agentWorkList");
    this.agents.forEach((agent, agentId) => {
      let match = false;
      agent.seeAlso.forEach(seeAlso => {
        if (seeAlso.pathname === work.url.pathname) match = true;
      });

      if (match) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.textContent = agent.name;
        a.href = "/comedig/agent?id=" + agentId;
        li.appendChild(a);
        agentWorkList.appendChild(li);
      }
    });
  },

  maybeShowAgent() {
    if (!location.pathname.startsWith("/comedig/agent")) {
      return;
    }

    const urlParam = new URLSearchParams(location.search);
    const agentId = urlParam.get("id");
    const agent = this.agents[agentId];

    document.getElementById("agentTitle").textContent = agent.name;

    const agentWorkList = document.getElementById("agentWorkList");
    this.works.forEach((work, workId) => {
      let match = false;
      agent.seeAlso.forEach(seeAlso => {
        if (seeAlso.pathname === work.url.pathname) match = true;
      });

      if (match) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.textContent = work.title;
        a.href = "/comedig/work?id=" + workId;
        li.appendChild(a);
        agentWorkList.appendChild(li);
      }
    });
  },

  async importPeople() {
    const store = await new Promise(resolve => {
      rdfstore.create({
        communication: {
          parsers: {},
          precedences: ["text/n3", "text/turtle", "application/rdf+xml", "text/html", "application/json"] }
        },
        (err, store) => {
          if (err) {
            alert("Unable to create a RDF store:" + err);
            resolve(null);
            return;
          }

          resolve(store);
        });
    });

    if (!store) return;

    const rdfData = await fetch("/comedig/rdf/people.rdf").then(r => r.text());
    await new Promise(resolve => {
      store.load("text/turtle", rdfData, (err, results) => {
        if (err) {
          alert("Unable to import a RDF document:" + err);
        }
        resolve();
      });
    });

    const results = await new Promise(resolve => {
      var query = `
PREFIX foaf:<http://xmlns.com/foaf/0.1/>
PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>
SELECT ?name ?seeAlso WHERE {
  ?o a foaf:Agent ;
     foaf:name ?name ;
     rdfs:seeAlso ?seeAlso .
}`;
      store.execute(query, (err, results) => {
        if (err) {
          alert("Unable to exec a SPARQL query:" + err);
          resolve([]);
        }
        resolve(results);
      });
    });

    results.forEach(result => {
      const agent = this.agents.find(a => a.name === result.name.value);
      if (agent) {
        agent.seeAlso.push(new URL(result.seeAlso.value, window.location));
        return;
      }

      this.agents.push({
        name: result.name.value,
        seeAlso: [ new URL(result.seeAlso.value, window.location) ],
      });
    });
  }
};

Comedig.init();
