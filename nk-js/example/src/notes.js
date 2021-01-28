const noteFromParameters = ({ title, body }) => ({ title, body });
const newNote = () => noteFromParameters({ title: 'New Note', body: '' });
const valueToNote = value => value ? JSON.parse(value) : undefined;
const noteToValue = note => note ? JSON.stringify(note) : undefined;

export { noteFromParameters, newNote, valueToNote, noteToValue };
