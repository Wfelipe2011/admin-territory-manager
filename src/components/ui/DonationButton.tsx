import React from "react";
import { Button } from "@/components/ui/button"; // componente do shadcn
import { FaDonate } from "react-icons/fa"; // importando o ícone de doação

export const DonationButton = () => {
  return (
    <div className="">
      <a
        href="https://www.paypal.com/donate/?hosted_button_id=VKVMUKKR6QCSA"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button variant="default" className="flex items-center gap-2">
          <FaDonate size={20} />
          Doar
        </Button>
      </a>
    </div>
  );
};

