export default function PromoBar() {
  return (
    <div className="topbar">
      <div className="wrap topbarRow">
        <div className="topbarLeft">
          <span className="dot" />
          <span><b>Shiv Furniture House</b> • Quality furniture • Easy UPI payments</span>
        </div>

        <div className="topbarRight">
          <a className="topbarLink" href="tel:+919999999999">Call: +91 99999 99999</a>
          <span className="sep">|</span>
          <a
            className="topbarLink"
            href="https://wa.me/919999999999"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp Support
          </a>
        </div>
      </div>
    </div>
  );
}
