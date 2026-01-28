#target photoshop
// --- Блок защиты (Запутанный код) ---
eval(function(p,a,c,k,e,r){e=function(c){return c.toString(a)};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('n 1(){2 3=$.4("5");2 6="7://8.9.a/b/c/d/e/f.g";2 h=j k(l.m+"/o.p");2 q="r -s \\"[t.u.v]::w = [t.u.x]::y; (z-A B.C).D(\'"+6+"\', \'"+h.E+"\')\\"";F.G(q);H(!h.I){J("K: L M.");N O}h.P("r");2 Q=O;2 R=O;S(!h.T){2 9=h.U();2 7=9.V(";");W(7[0]===3){Q=O;2 X=Y(7[1]);2 Z=j k();2 10=11.12((Z-X)/(13*14*15*16));W(10>=0&&10<=30){R=O}17{J("18 19!")}1a}}h.1b();H(!Q){J("1c 1d: "+3);N 1e}N R}n Y(s){2 d=s.1f("-");N j k(d[0],d[1]-1,d[2])}H(!1()){1g}',62,89,'|check|var|pc|getenv|COMPUTERNAME|url|http|raw|githubusercontent|com|grishkovec16|art|Photoshop|Scripts|main|whitelist|txtFile|new|File|Folder|temp|function|lic|tmp|ps|powershell|command|Net|ServicePointManager|SecurityProtocol|Tls12|SecurityProtocolType|Tls12|New|Object|WebClient|DownloadFile|fsName|app|system|if|exists|alert|Ошибка|Лицензия|не|return|true|open|found|granted|while|eof|readln|split|if|start|parseDate|current|diff|Math|floor|1000|60|24|else|Срок|истек|break|close|Доступ|запрещен|false|split|return'.split('|'),0,{}));

// --- ДАЛЕЕ ИДЕТ ВАШ ОСНОВНОЙ КОД СКРИПТА ---
// alert("Лицензия подтверждена! Скрипт запущен.");

function main() {
    if (app.documents.length === 0) {
        alert("Сначала откройте PSD шаблон!");
        return;
    }

    var doc = app.activeDocument;
    var rootFolder = Folder.selectDialog("Выберите папку с материалами");
    if (!rootFolder) return;

    var folders = rootFolder.getFiles(function(f) { return f instanceof Folder; });
    folders.sort(); 

    var studentIndex = 1;

    for (var i = 0; i < folders.length; i++) {
        var folderName = decodeURI(folders[i].name);
        
        var imgFiles = folders[i].getFiles(/\.(jpg|jpeg|png|tif)$/i);
        if (imgFiles.length === 0) continue;
        var photoFile = imgFiles[0];

        var targetID;
        var labelText;

        // ПРОВЕРКА НА УЧИТЕЛЯ
        if (folderName.indexOf("УЧ_") === 0) {
            targetID = "Учитель_1"; 
            labelText = folderName.replace("УЧ_", ""); 
        } else {
            targetID = "Фото_" + studentIndex;
            labelText = folderName;
            studentIndex++;
        }

        processPersonAsSmartObject(doc, photoFile, labelText, targetID);
    }

    alert("Готово! Все фото добавлены как Smart-объекты.");
}

function processPersonAsSmartObject(doc, file, nameText, layerName) {
    try {
        // 1. Обновляем текст
        var txtLayer = findSpecificLayer(doc, layerName, true);
        if (txtLayer) {
            txtLayer.textItem.contents = nameText;
        }

        // 2. Вставляем фото как Smart Object
        var placeholder = findSpecificLayer(doc, layerName, false);
        if (placeholder) {
            doc.activeLayer = placeholder;

            // Команда вставки файла как Smart-объекта
            placeSmartObject(file);

            var newLayer = doc.activeLayer;
            newLayer.move(placeholder, ElementPlacement.PLACEBEFORE);
            
            // Масштабирование
            fitLayerSafely(newLayer, placeholder);

            // Создание обтравочной маски
            try { newLayer.group(); } catch(e) {}
            newLayer.name = "IMG_" + nameText;
        }
    } catch (err) {
        $.writeln("Ошибка: " + nameText + " - " + err);
    }
}

function placeSmartObject(file) {
    var desc = new ActionDescriptor();
    desc.putPath(charIDToTypeID("null"), new File(file));
    desc.putEnumerated(charIDToTypeID("FTcs"), charIDToTypeID("QCSt"), charIDToTypeID("Qcsa"));
    executeAction(charIDToTypeID("Plc "), desc, DialogModes.NO);
}

function findSpecificLayer(container, name, isText) {
    for (var i = 0; i < container.layers.length; i++) {
        var lyr = container.layers[i];
        if (lyr.name === name) {
            if (isText && lyr.kind === LayerKind.TEXT) return lyr;
            if (!isText && lyr.kind !== LayerKind.TEXT) return lyr;
        }
        if (lyr.typename === "LayerSet") {
            var res = findSpecificLayer(lyr, name, isText);
            if (res) return res;
        }
    }
    return null;
}

function fitLayerSafely(layer, target) {
    try {
        var b = target.bounds;
        var tw = b[2].as("px") - b[0].as("px");
        var th = b[3].as("px") - b[1].as("px");
        
        var lb = layer.bounds;
        var lw = lb[2].as("px") - lb[0].as("px");
        var lh = lb[3].as("px") - lb[1].as("px");

        if (lw == 0 || lh == 0) return;

        var scale = Math.max(tw / lw, th / lh) * 100;
        layer.resize(scale, scale, AnchorPosition.MIDDLECENTER);

        var dx = (b[0].as("px") + tw/2) - (layer.bounds[0].as("px") + (layer.bounds[2].as("px") - layer.bounds[0].as("px"))/2);
        var dy = (b[1].as("px") + th/2) - (layer.bounds[1].as("px") + (layer.bounds[3].as("px") - layer.bounds[1].as("px"))/2);
        layer.translate(dx, dy);
    } catch(e) {}
}


main();
