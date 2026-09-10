import moment from 'moment';

export const formatTimestampForMessage = (date: Date) => {
  const now = moment();
  const messageDate = moment(date);

  if (now.isSame(messageDate, 'day')) {
    return messageDate.format('h:mm A'); // Same day (e.g., 12:45 PM)
  } else if (now.subtract(1, 'day').isSame(messageDate, 'day')) {
    return `Yesterday ${messageDate.format('h:mm A')}`;
  } else {
    return messageDate.format('MM-DD-YYYY h:mm A'); // Older messages
  }
};