import toast from 'react-hot-toast';
import ToastCard from '../components/common/Toast';

const DURATIONS = {
  success: 3500,
  error: 4500,
  warning: 4000,
  info: 3500,
  loading: Infinity,
};

const show = (type) => (message, options = {}) => {
  const { icon, ...rest } = options;
  return toast.custom((t) => <ToastCard t={t} type={type} message={message} icon={icon} />, {
    duration: DURATIONS[type],
    ...rest,
  });
};

const notify = show('info');

notify.success = show('success');
notify.error = show('error');
notify.warning = show('warning');
notify.info = show('info');
notify.loading = show('loading');
notify.dismiss = toast.dismiss;
notify.remove = toast.remove;

export default notify;