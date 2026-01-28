#target photoshop

function renameJpegsWithIndex() {
    var rootFolder = Folder.selectDialog("Выберите корневую папку (например, 'Обложка')");
    if (rootFolder == null) return; 

    var items = rootFolder.getFiles();

    for (var i = 0; i < items.length; i++) {
        if (items[i] instanceof Folder) {
            var currentFolder = items[i];
            var folderName = currentFolder.name;
            
            // Получаем список только JPG файлов
            var allFiles = currentFolder.getFiles();
            var jpgFiles = [];
            
            for (var f = 0; f < allFiles.length; f++) {
                if (allFiles[f] instanceof File && allFiles[f].name.match(/\.(jpg|jpeg)$/i)) {
                    jpgFiles.push(allFiles[f]);
                }
            }

            // Переименовываем найденные файлы
            for (var j = 0; j < jpgFiles.length; j++) {
                var file = jpgFiles[j];
                var ext = file.name.split('.').pop();
                var newName;

                if (jpgFiles.length > 1) {
                    // Если файлов несколько, добавляем _1, _2 и т.д.
                    newName = folderName + "_" + (j + 1) + "." + ext;
                } else {
                    // Если файл один, оставляем только имя папки
                    newName = folderName + "." + ext;
                }

                file.rename(newName);
            }
        }
    }
    
    alert("Готово! Все фотографии переименованы.");
}


renameJpegsWithIndex();
