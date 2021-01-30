const noteFromParametersFactory = ({ title, body }) => ({ title, body });
const noteFactory = () => noteFromParametersFactory({ title: 'New Note', body: '' });

const valueToNote = value => value ? JSON.parse(value) : undefined;
const noteToValue = note => note ? JSON.stringify(note) : undefined;

export { noteFromParametersFactory, noteFactory, valueToNote, noteToValue };
