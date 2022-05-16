// get bib data
fetch('bibliography.json')
.then(response => response.json())
.then(data => addAltText(data));

// populate in-text references with alt text
function addAltText(data) {
    bibrefs = document.getElementsByClassName('bibref')
    Array.from(bibrefs).forEach(function(element) {
        let citekey = element.getAttribute('cite');
        console.log(data[citekey]["text"]);
        element.setAttribute("title", data[citekey]["text"].replace(/<[^>]*>?/gm, ''));
    });
    
}

