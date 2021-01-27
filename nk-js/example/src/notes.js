const noteFromParameters = ({ title, body }) => ({ title, body });
const newNote = () => noteFromParameters({ title: 'New Note', body: '' });
const valueToNote = value => JSON.stringify(value);
const noteToValue = note => JSON.stringify(note);

export { noteFromParameters, newNote, valueToNote, noteToValue };
