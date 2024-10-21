import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';

export const POST = async (req) => {
  const formData = await req.formData();
  const file = formData.get('file');

  if (!file) {
    return NextResponse.json({ message: 'File missing' }, { status: 400 });
  }

  const tempPath = file.name;  // Get original file name
  const testDir = path.join(process.cwd(), 'public/test');  // Directory for test images

  // Ensure the test directory exists
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const filePath = path.join(testDir, tempPath);
  const buffer = Buffer.from(await file.arrayBuffer());

  // Save the test image
  fs.writeFileSync(filePath, buffer);

  // Specify the full path to the Python interpreter
  const pythonPath = '/Users/aadi/anaconda3/bin/python'; // Adjust this if necessary

  // Run the recognition script using the full path to the Python interpreter
  const scriptPath = path.join(process.cwd(), 'recognize_faces.py');
  
  // Create a new Promise to handle the exec command asynchronously
  return new Promise((resolve, reject) => {
    exec(`${pythonPath} ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${stderr}`);
        return reject({ message: 'Caption generation failed' });
      }

      console.log(`Caption generation output: ${stdout}`);
      // Resolve with the stdout as the response
      return resolve(NextResponse.json({ message: stdout }));
    });
  });
};