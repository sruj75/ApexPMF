type StartPracticeFormProps = {
  action: () => void | Promise<void>;
  className?: string;
  buttonClassName?: string;
};

export function StartPracticeForm({
  action,
  className,
  buttonClassName = "primary-action"
}: StartPracticeFormProps) {
  return (
    <form action={action} className={className}>
      <button className={buttonClassName} type="submit">
        Start Practice
      </button>
    </form>
  );
}
