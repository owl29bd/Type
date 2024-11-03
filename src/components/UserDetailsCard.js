import peopleLogo from "../people.svg";

const UserDetailsCard = ({ name, dept, reg }) => {
  const imageDimension = 200;
  return (
    <div className="flex flex-row-reverse items-center border-2 p-2">
      <div className="flex flex-col">
        <div className="flex items-center">
          <h1 className="font-thin text-2xl">Hello&nbsp;</h1>
          <p className="font-bold text-4xl">{name}!</p>
        </div>
        <div>
          <p className="flex text-2xl">
            <section className="font-thin">Registration No:&nbsp;</section>
            {reg}
          </p>
          <p className="flex text-2xl">
            <section className="font-thin">Department:&nbsp;</section>
            {dept}
          </p>
        </div>
      </div>
      <div className="flex justify-center p-2">
        <img
          width={imageDimension}
          height={imageDimension}
          src={peopleLogo}
          alt="user"
        />
      </div>
    </div>
  );
};

export default UserDetailsCard;
