#target photoshop

function flattenPhotosFolder() {
    // Выбор корневой папки (например, "Обложка" или "сюжет и портреты")
    var rootFolder = Folder.selectDialog("Выберите папку, в которой лежат папки учеников");
    
    if (rootFolder == null) return; // Если нажали "Отмена"

    // Получаем все подпапки (папки учеников)
    var studentFolders = rootFolder.getFiles();

    for (var i = 0; i < studentFolders.length; i++) {
        if (studentFolders[i] instanceof Folder) {
            
            // Ищем папку "Photos" внутри папки ученика
            var photosFolder = Folder(studentFolders[i].fsName + "/Photos");
            
            if (photosFolder.exists) {
                var files = photosFolder.getFiles();
                
                for (var j = 0; j < files.length; j++) {
                    if (files[j] instanceof File) {
                        // Путь назначения (в папку ученика)
                        var destinationPath = studentFolders[i].fsName + "/" + files[j].name;
                        
                        // Перемещаем файл
                        files[j].copy(destinationPath);
                        files[j].remove();
                    }
                }
                
                // Удаляем теперь уже пустую папку "Photos"
                photosFolder.remove();
            }
        }
    }
    
    alert("Готово! Папки Photos обработаны.");
}

flattenPhotosFolder();