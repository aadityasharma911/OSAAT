import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';

export const POST = async (req) => {
  const formData = await req.formData();
  const file = formData.get('file');
  const option = formData.get('option');
  const personName = formData.get('personName');  // May be null if not training

  if (!file || !option) {
    return NextResponse.json({ message: 'File or option missing' }, { status: 400 });
  }

  const tempPath = file.name;  // Get original file name
  const uploadDir = path.join(process.cwd(), 'public/uploads');  // Upload directory

  // Ensure the upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, tempPath);
  const buffer = Buffer.from(await file.arrayBuffer());

  // Save the file
  fs.writeFileSync(filePath, buffer);

  // Specify the full path to the Python interpreter
  const pythonPath = '/Users/aadi/anaconda3/bin/python'; // Adjust this if necessary

  // If option is 'train', store image in the person's folder
  if (option === 'train') {
    if (!personName) {
      return NextResponse.json({ message: 'Person name is required for training' }, { status: 400 });
    }

    const personDir = path.join(uploadDir, personName);  // Create person folder if necessary
    if (!fs.existsSync(personDir)) {
      fs.mkdirSync(personDir, { recursive: true });
    }

    // Move the image to the person's folder
    const personImagePath = path.join(personDir, tempPath);
    fs.renameSync(filePath, personImagePath);

    // Run the training script using the full path to the Python interpreter
    const scriptPath = path.join(process.cwd(), 'train_faces.py');
    exec(`${pythonPath} ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${stderr}`);
        return NextResponse.json({ message: 'Training failed' }, { status: 500 });
      }
      console.log(`Training output: ${stdout}`);
    });

    return NextResponse.json({ message: `Training started for ${personName}` });
  }

  // If option is 'generate', run caption generation
  if (option === 'generate') {
    const scriptPath = path.join(process.cwd(), 'recognize_faces.py');
    exec(`${pythonPath} ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${stderr}`);
        return NextResponse.json({ message: 'Caption generation failed' }, { status: 500 });
      }
      console.log(`Caption generation output: ${stdout}`);
    });

    return NextResponse.json({ message: 'Caption generation started' });
  }

  return NextResponse.json({ message: 'Invalid option' }, { status: 400 });
};