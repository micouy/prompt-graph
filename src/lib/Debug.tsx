const Debug = ({ data }: { data: unknown }) => {
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
};

export default Debug;
