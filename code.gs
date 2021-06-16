function faxTransfer() {
  // Get all the unread threads
  var threads = GmailApp.search('in:inbox is:unread', 0, 100);

  for (thread of threads) {
    // Get messages(mails) from every thread
    for (msg of thread.getMessages()) {
      if (msg.isUnread() == false) { // This mail has been checked before
        continue;
      }

      // Get FAX Pdf (attachment)
      let attachment = msg.getAttachments()[0]; //always just 1 file

      // Extract Text from Fax Pdf
      if (!attachment) { //continue if the mail without attachment
        continue;
      }

      let text = extractTextFromPDF(attachment);

      // Get Setting 
      let settings = SpreadsheetApp.getActive().getSheetByName("Setting").getDataRange().getValues();
      settings.shift(); // remove the first row (the title row)

      //try to match all the conditions, transfer when every match
      for (condition of settings) {
        let subject = condition[0];
        let keywords = condition[0].split(","); //if keywords more than 1, seperate with comma ","
        let to = condition[1];
        let cc = condition[2];

        function matchKeywords() {
          for (let kw of keywords) {
            if (text.indexOf(kw) == -1) { //not match
              return false;
            }
          }
          return true;  //success match all the keywords in this condition
        }

        if (matchKeywords() == true) { // found keyword in text
          // console.log(to);
          // send mail to 
          MailApp.sendEmail(to, subject, text, {  // to, subject, body
            cc: cc, //add cc
            // bcc: "dio-lee@tiger-sg.co.jp",  //for test
            attachments: [attachment.getAs(MimeType.PDF)], // with FAX Pdf as attachment
          });
          console.log("Transfered a Fax to " + to);
        }
        //next condition
      }
      //end match all conditions
      console.log("Found but no match");


      msg.markRead(); //mark unread to read
    }
  }
}

function extractTextFromPDF(attachment) {
  var blob = attachment.getAs(MimeType.PDF);
  var resource = {
    title: blob.getName(),
    mimeType: blob.getContentType()
  };

  // Enable the Advanced Drive API Service
  var file = Drive.Files.insert(resource, blob, { ocr: true, ocrLanguage: "ja" }); //use ocr with japanese

  // Extract Text from PDF file
  var doc = DocumentApp.openById(file.id);
  var text = doc.getBody().getText();

  //Delete the temp file
  DriveApp.getFileById(file.id).setTrashed(true);

  // console.log(text);
  return text;
}
