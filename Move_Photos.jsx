#target photoshop

/**
 * Ультра-надежный поиск ключа
 */
function getStoredLicenseKey() {
    if (typeof app.vignetteKey !== 'undefined' && app.vignetteKey !== null) {
        return app.vignetteKey;
    }
    try {
        var ref = new ActionReference();
        ref.putProperty(charIDToTypeID('Prpt'), stringIDToTypeID('vignette_license_key'));
        ref.putEnumerated(charIDToTypeID('capp'), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'));
        var result = executeActionGet(ref);
        return result.getString(stringIDToTypeID('vignette_license_key'));
    } catch (e) { return null; }
}

function main() {
    try {
        var key = getStoredLicenseKey();
        if (!key) {
            alert("ОШИБКА АКТИВАЦИИ: Ключ не найден.");
            return;
        }

        var rootFolder = Folder.selectDialog("Выберите общую папку (где лежат папки детей)");
        if (!rootFolder) return;

        var folders = rootFolder.getFiles(function(f) { return f instanceof Folder; });
        var movedCount = 0;

        for (var i = 0; i < folders.length; i++) {
            var childFolder = folders[i];
            // Ищем папку Photos внутри папки ребенка
            var photosDir = Folder(childFolder.fsName + "/Photos");
            
            if (photosDir.exists) {
                var files = photosDir.getFiles();
                for (var j = 0; j < files.length; j++) {
                    if (files[j] instanceof File) {
                        var destination = new File(childFolder.fsName + "/" + files[j].name);
                        if (destination.exists) destination.remove();
                        files[j].copy(destination);
                        files[j].remove();
                        movedCount++;
                    }
                }
                photosDir.remove(); // Удаляем пустую папку Photos
            }
        }

        alert("Готово! Перемещено файлов: " + movedCount);

    } catch (err) {
        alert("Ошибка при перемещении: " + err);
    }
}

main();
