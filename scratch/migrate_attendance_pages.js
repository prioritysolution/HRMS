const fs = require('fs');
const path = require('path');

const dir = 'd:\\Priority Solution\\HRMS\\src\\app\\(app)\\attendance';

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('AttendanceModulePage')) {
        // Replace import
        content = content.replace(
          /import \{ AttendanceModulePage \} from "@\/components\/attendance\/AttendanceModulePage";/g,
          'import { MasterDataPage } from "@/components/ui/MasterDataPage";'
        );
        // Replace tag
        content = content.replace(/<AttendanceModulePage/g, '<MasterDataPage');
        content = content.replace(/<\/AttendanceModulePage>/g, '</MasterDataPage>');
        
        // Remove unsupported props (using regex to remove the whole line if it only contains the prop)
        content = content.replace(/^\s*modalSubtitle=.*$/gm, '');
        content = content.replace(/^\s*emptyStateMessage=.*$/gm, '');
        content = content.replace(/^\s*enrichRow=.*$/gm, '');

        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(dir);
