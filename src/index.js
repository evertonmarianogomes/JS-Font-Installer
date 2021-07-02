/** ES6 Import Modules */
import FindFiles from "./FindFilesGlobal.js";
import woff2sfntd from "./Converter.js";

/** Node.JS require modules */
const path = require('path');
const fs = require('fs');
const $ = require("jquery");
const {
    dialog
} = require('electron').remote;
const Shell = require('node-powershell');

var globalDirectory = "";

$("#commandList").append("<small class=\"text-primary\">[Electron] Ready....</small> <br/>");

/**
 * @param {string} url 
 * @param {string} separator 
 * @returns {string} URL
 */
const getFilename = (url, separator) => {
    let result = "";
    var segmented = url.split(separator);
    for (var i = 0; i < segmented.length; i++) {
        result += segmented[i] + "\\\\";
    }
    return result;
}

$("#btnDirectory").on("click", () => {
    let directory = dialog.showOpenDialog({
        properties: ['openDirectory']
    });

    directory.then(data => {
        globalDirectory = data.filePaths.toString();
        var url = data.filePaths.toString();

        $("#commandList").html("<small> Diretório selecionado: " + url + "</small> <br/>");
        let directoryName = getFilename(url, "\\");

        /** Searching Woff Files */
        let woffFiles = FindFiles(directoryName, ".woff");
        woffFiles.map(data => {
            convertFonts(data, path.parse(data).name + ".ttf");
        });

        $("#commandList").append("<p class=\"text-primary\">[PowerShell] Instalando fontes, aguarde...</p>");

        installFonts(".ttf").then(output => {
            $("#commandList").append("<small>[TTF] Fontes TFF (TrueType Font) instaladas com sucesso</small><br/>");
            installFonts(".otf").then(output => {
                $("#commandList").append("<small>[OTF] Fontes OTF (OpenType Font) instaladas com sucesso</small>");
            }).catch(err => {
                $("#commandList").append("<small class=\"text-danger\">Erro: " + err.message + "</small>");
            })
        }).catch(err => {
            $("#commandList").append("<p class=\"text-danger\">" + err.message + "</p>");
        });

    }).catch(err => {
        $("#commandList").append("<p class=\"text-danger\">" + err.message + "</p>");
    });

});


function convertFonts(input, output) {
    var none = fs.readFileSync(input);
    var woff = Buffer.from(none);
    fs.writeFileSync(path.parse(input).dir + "\\" + output, woff2sfntd(woff));

    $("#commandList").append(`<small class="text-success">[WOFF]  ${path.parse(input).base} convertida para TTF com sucesso</small><br/>`);
}


function otfFonts() {
    let ps = new Shell({
        executionPolicy: 'Bypass',
        noProfile: true
    });
    let command = "cd \"" + globalDirectory + "\\" + "\";$fonts = (New-Object -ComObject Shell.Application).Namespace(0x14); Get-ChildItem -Recurse -include *.otf | % { $fonts.CopyHere($_.fullname) };";
    ps.addCommand(command);
    ps.invoke().then(output => {
        $("#commandList").append("<small>[OTF] Fontes OTF (OpenType Font) instaladas com sucesso</small>");
    }).catch(err => {
        $("#commandList").append("<small class=\"text-danger\">Erro: " + err.message + "</small>");
    });
}

/** Function that runs a Windows PowerShell command to install fonts from the selected directory
 * @param {string} ext Font Extension [.ttf or .otf]
 */
const installFonts = (ext) => {
    let ps = new Shell({
        executionPolicy: 'Bypass',
        noProfile: true
    });

    let command = "cd \"" + globalDirectory + "\\" + "\";$fonts = (New-Object -ComObject Shell.Application).Namespace(0x14); Get-ChildItem -Recurse -include *" + ext + " | % { $fonts.CopyHere($_.fullname) };";

    ps.addCommand(command);
    return ps.invoke();
}