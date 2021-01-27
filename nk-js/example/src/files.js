import { Button, FormControl, InputGroup, ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

const FileBrowser = ({ notes = {}, activeNote, onCreateNote, onNoteSelected, }) => {
  const listItems = [(
    <ListGroup.Item key={'__new__'}>
      <Button
        variant={'outline-success'}
        onClick={() => onCreateNote()}
      >+ New Note</Button>
    </ListGroup.Item>
  )];

  for (const [k, v] of Object.entries(notes)) {
    listItems.push(
      <ListGroup.Item
        key={k}
        active={activeNote === k}
        onClick={() => onNoteSelected(k)}
      >
        {k}
      </ListGroup.Item>);
  }

  return (
    <div>
      <div className={'pb-4'}>
        <InputGroup>
          <FormControl type={'text'} placeholder={'Search'} size={'lg'} />
          <InputGroup.Append>
            <Button variant={'outline-success'}><FontAwesomeIcon icon={faSearch} /></Button>
          </InputGroup.Append>
        </InputGroup>
      </div>

      <ListGroup>
        {listItems}
      </ListGroup>
    </div>
  );
};

export default FileBrowser;
